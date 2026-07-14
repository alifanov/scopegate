import { SpanStatusCode, metrics, trace } from "@opentelemetry/api";
import { db } from "@/lib/db";
import {
  EXCHANGE_PROVIDERS,
  refreshForCron,
  classifyOAuthError,
  CONSECUTIVE_FAILURES_THRESHOLD,
  OAuthTokenError,
  type CronConnection,
} from "@/lib/oauth-token-lifecycle";

const tracer = trace.getTracer("scopegate/cron/refresh-tokens");
const tokenRefreshFailuresCounter = metrics
  .getMeter("scopegate")
  .createCounter("token_refresh_failures_total", {
    description: "OAuth token refresh failures by reason and provider",
  });

const REFRESH_TIMEOUT_MS = 10_000;

export type RefreshResult =
  | { status: "refreshed" }
  | { status: "skipped" }
  | { status: "error"; message: string }
  | { status: "revoked"; message: string };

export type RefreshConnectionRow = CronConnection & {
  accountEmail: string;
  projectId: string;
  consecutiveFailures: number;
};

type TokenRefreshDatabase = {
  serviceConnection: Pick<typeof db.serviceConnection, "findMany" | "update">;
  teamMember: Pick<typeof db.teamMember, "findMany">;
  notification: Pick<typeof db.notification, "createMany">;
};

export type TokenRefreshSummary = {
  refreshed: number;
  skipped: number;
  failed: number;
  revoked: number;
  total: number;
  errors?: { id: string; provider: string; error: string }[];
};

type TokenRefreshOptions = {
  database?: TokenRefreshDatabase;
  now?: Date;
  refreshConnectionToken?: (
    connection: RefreshConnectionRow
  ) => Promise<RefreshResult>;
};

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`OAuth timeout after ${REFRESH_TIMEOUT_MS}ms [${label}]`)),
        REFRESH_TIMEOUT_MS
      )
    ),
  ]);
}

async function applyRefreshError(
  connection: RefreshConnectionRow,
  err: unknown,
  message: string,
  database: TokenRefreshDatabase
): Promise<RefreshResult> {
  // Every error reaching this function already comes from a token refresh
  // attempt, so classifyOAuthError's default ("transient") is exactly right
  // even for a generic network error — there's no "not related to auth" case
  // here the way there is for on-demand MCP tool calls.
  const errorClass = classifyOAuthError(err);
  const errorCode = err instanceof OAuthTokenError && err.code !== undefined ? String(err.code) : "other";

  tokenRefreshFailuresCounter.add(1, {
    reason: errorCode,
    error_class: errorClass,
    provider: connection.provider,
  });

  let newStatus: string;
  let newConsecutiveFailures: number;

  if (errorClass === "permanent") {
    newStatus = "revoked";
    newConsecutiveFailures = 0;
    console.info(
      `[ScopeGate] Token revoked (${errorCode}): provider=${connection.provider} accountEmail=${connection.accountEmail} connectionId=${connection.id} projectId=${connection.projectId}`
    );
  } else {
    newConsecutiveFailures = connection.consecutiveFailures + 1;
    if (newConsecutiveFailures >= CONSECUTIVE_FAILURES_THRESHOLD) {
      newStatus = "revoked";
      console.info(
        `[ScopeGate] Token deactivated after ${newConsecutiveFailures} consecutive failures: provider=${connection.provider} accountEmail=${connection.accountEmail} connectionId=${connection.id} projectId=${connection.projectId}`
      );
    } else {
      newStatus = "error";
    }
  }

  try {
    await database.serviceConnection.update({
      where: { id: connection.id },
      data: {
        status: newStatus,
        lastError: message,
        consecutiveFailures: newConsecutiveFailures,
      },
    });
  } catch {
    // best-effort status update
  }

  if (newStatus === "revoked") return { status: "revoked", message };
  return { status: "error", message };
}

export async function refreshConnectionToken(
  connection: RefreshConnectionRow,
  database: TokenRefreshDatabase = db
): Promise<RefreshResult> {
  return tracer.startActiveSpan(
    "refresh_connection",
    { attributes: { provider: connection.provider, "connection.id": connection.id } },
    async (span) => {
      try {
        const outcome = await tracer.startActiveSpan(
          "oauth.fetch_token",
          { attributes: { provider: connection.provider } },
          async (fetchSpan) => {
            try {
              return await withTimeout(refreshForCron(connection), connection.provider);
            } finally {
              fetchSpan.end();
            }
          }
        );

        span.setAttribute("refresh.status", outcome);
        return { status: outcome };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        span.setStatus({ code: SpanStatusCode.ERROR, message });
        span.recordException(err instanceof Error ? err : new Error(message));
        span.setAttribute("refresh.status", "error");
        return applyRefreshError(connection, err, message, database);
      } finally {
        span.end();
      }
    }
  );
}

async function createRevokedTokenNotifications(
  revokedRows: RefreshConnectionRow[],
  database: TokenRefreshDatabase
): Promise<void> {
  if (revokedRows.length === 0) return;

  try {
    const projectIds = [...new Set(revokedRows.map((connection) => connection.projectId))];
    const teamMembers = await database.teamMember.findMany({
      where: { projectId: { in: projectIds } },
      select: { userId: true, projectId: true },
    });
    await database.notification.createMany({
      data: revokedRows.flatMap((connection) => {
        const members = teamMembers.filter(
          (member) => member.projectId === connection.projectId
        );
        return members.map((member) => ({
          userId: member.userId,
          type: "error",
          title: "Reconnect required",
          message: `Access to ${connection.provider} (${connection.accountEmail}) was revoked by the provider. Reconnect the account in project settings.`,
        }));
      }),
    });
  } catch {
    // best-effort notifications
  }
}

export async function refreshExpiringConnectionTokens({
  database = db,
  now = new Date(),
  refreshConnectionToken: refreshOne = (connection) =>
    refreshConnectionToken(connection, database),
}: TokenRefreshOptions = {}): Promise<TokenRefreshSummary> {
  return tracer.startActiveSpan("cron.refresh_tokens", async (rootSpan) => {
    try {
      const bufferMs = 10 * 60 * 1000;
      const threshold = new Date(now.getTime() + bufferMs);
      const exchangeProviders = [...EXCHANGE_PROVIDERS];

      const connections = await tracer.startActiveSpan(
        "db.find_expiring_connections",
        async (dbSpan) => {
          try {
            return await database.serviceConnection.findMany({
              where: {
                expiresAt: { not: null, lt: threshold },
                status: { notIn: ["error", "revoked"] },
                OR: [
                  { refreshToken: { not: null } },
                  { provider: { in: exchangeProviders } },
                ],
              },
              select: {
                id: true,
                provider: true,
                accountEmail: true,
                accessToken: true,
                refreshToken: true,
                expiresAt: true,
                projectId: true,
                consecutiveFailures: true,
              },
            });
          } finally {
            dbSpan.end();
          }
        }
      );

      rootSpan.setAttribute("connections.total", connections.length);

      const results = await Promise.all(connections.map(refreshOne));

      let refreshed = 0;
      let skipped = 0;
      let failed = 0;
      let revoked = 0;
      const errors: { id: string; provider: string; error: string }[] = [];
      const revokedRows: RefreshConnectionRow[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const connection = connections[i];
        if (result.status === "refreshed") refreshed++;
        else if (result.status === "skipped") skipped++;
        else if (result.status === "revoked") {
          failed++;
          revoked++;
          revokedRows.push(connection);
          errors.push({
            id: connection.id,
            provider: connection.provider,
            error: result.message,
          });
        } else if (result.status === "error") {
          failed++;
          errors.push({
            id: connection.id,
            provider: connection.provider,
            error: result.message,
          });
        }
      }

      await createRevokedTokenNotifications(revokedRows, database);

      rootSpan.setAttribute("refresh.refreshed", refreshed);
      rootSpan.setAttribute("refresh.skipped", skipped);
      rootSpan.setAttribute("refresh.failed", failed);
      rootSpan.setAttribute("refresh.revoked", revoked);

      return {
        refreshed,
        skipped,
        failed,
        revoked,
        total: connections.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } finally {
      rootSpan.end();
    }
  });
}

import { NextResponse } from "next/server";
import { trace, SpanStatusCode, metrics } from "@opentelemetry/api";
import { db } from "@/lib/db";
import { refreshAccessToken } from "@/lib/google-oauth";
import { refreshLinkedInAccessToken } from "@/lib/linkedin-oauth";
import { refreshThreadsTokenForConnection } from "@/lib/threads-oauth";
import { encrypt, decrypt } from "@/lib/crypto";

const tracer = trace.getTracer("scopegate/cron/refresh-tokens");
const tokenRefreshFailuresCounter = metrics
  .getMeter("scopegate")
  .createCounter("token_refresh_failures_total", {
    description: "OAuth token refresh failures by reason and provider",
  });

const GOOGLE_PROVIDERS = new Set([
  "gmail",
  "calendar",
  "drive",
  "googleAds",
  "searchConsole",
  "youtube",
  "googleTagManager",
]);

const REFRESH_TIMEOUT_MS = 10_000;

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

type RefreshResult =
  | { status: "refreshed" }
  | { status: "skipped" }
  | { status: "error"; message: string }
  | { status: "revoked"; message: string };

type ConnectionRow = {
  id: string;
  provider: string;
  accountEmail: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  projectId: string;
};

async function refreshConnection(connection: ConnectionRow): Promise<RefreshResult> {
  return tracer.startActiveSpan(
    "refresh_connection",
    { attributes: { provider: connection.provider, "connection.id": connection.id } },
    async (span) => {
      try {
        if (!connection.refreshToken) {
          span.setAttribute("refresh.status", "skipped");
          return { status: "skipped" as const };
        }
        const decryptedRefreshToken = decrypt(connection.refreshToken);

        if (GOOGLE_PROVIDERS.has(connection.provider)) {
          const tokens = await tracer.startActiveSpan(
            "oauth.fetch_token",
            { attributes: { provider: connection.provider } },
            async (fetchSpan) => {
              try {
                return await withTimeout(
                  refreshAccessToken(decryptedRefreshToken),
                  connection.provider
                );
              } finally {
                fetchSpan.end();
              }
            }
          );

          const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
          await tracer.startActiveSpan("db.save_token", async (saveSpan) => {
            try {
              await db.serviceConnection.update({
                where: { id: connection.id },
                data: {
                  accessToken: encrypt(tokens.access_token),
                  expiresAt,
                  status: "active",
                  lastError: null,
                },
              });
            } finally {
              saveSpan.end();
            }
          });

          span.setAttribute("refresh.status", "refreshed");
          return { status: "refreshed" as const };
        }

        if (connection.provider === "linkedin") {
          const tokens = await tracer.startActiveSpan(
            "oauth.fetch_token",
            { attributes: { provider: "linkedin" } },
            async (fetchSpan) => {
              try {
                return await withTimeout(
                  refreshLinkedInAccessToken(decryptedRefreshToken),
                  "linkedin"
                );
              } finally {
                fetchSpan.end();
              }
            }
          );

          const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
          const updateData: {
            accessToken: string;
            expiresAt: Date;
            status: string;
            lastError: null;
            refreshToken?: string;
          } = {
            accessToken: encrypt(tokens.access_token),
            expiresAt,
            status: "active",
            lastError: null,
          };
          if (tokens.refresh_token) {
            updateData.refreshToken = encrypt(tokens.refresh_token);
          }

          await tracer.startActiveSpan("db.save_token", async (saveSpan) => {
            try {
              await db.serviceConnection.update({
                where: { id: connection.id },
                data: updateData,
              });
            } finally {
              saveSpan.end();
            }
          });

          span.setAttribute("refresh.status", "refreshed");
          return { status: "refreshed" as const };
        }

        span.setAttribute("refresh.status", "skipped");
        return { status: "skipped" as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        span.setStatus({ code: SpanStatusCode.ERROR, message });
        span.recordException(err instanceof Error ? err : new Error(message));
        const isInvalidGrant = message.includes("invalid_grant");
        const newStatus = isInvalidGrant ? "revoked" : "error";
        const reason = isInvalidGrant ? "invalid_grant" : "other";
        if (isInvalidGrant) {
          console.info(
            `[ScopeGate] Token revoked (invalid_grant): provider=${connection.provider} accountEmail=${connection.accountEmail} connectionId=${connection.id} projectId=${connection.projectId}`
          );
        }
        tokenRefreshFailuresCounter.add(1, { reason, provider: connection.provider });
        try {
          await db.serviceConnection.update({
            where: { id: connection.id },
            data: { status: newStatus, lastError: message },
          });
        } catch {
          // best-effort status update
        }
        if (isInvalidGrant) return { status: "revoked" as const, message };
        return { status: "error" as const, message };
      } finally {
        span.end();
      }
    }
  );
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization")?.replace(/\s+/g, " ").trim();
  const expected = `Bearer ${cronSecret.trim()}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return tracer.startActiveSpan("cron.refresh_tokens", async (rootSpan) => {
    try {
      const bufferMs = 10 * 60 * 1000;
      const threshold = new Date(Date.now() + bufferMs);

      const [connections, threadsConnections] = await tracer.startActiveSpan(
        "db.find_expiring_connections",
        async (dbSpan) => {
          try {
            return await Promise.all([
              db.serviceConnection.findMany({
                where: {
                  refreshToken: { not: null },
                  expiresAt: { not: null, lt: threshold },
                  status: { notIn: ["error", "revoked"] },
                },
                select: {
                  id: true,
                  provider: true,
                  accountEmail: true,
                  accessToken: true,
                  refreshToken: true,
                  expiresAt: true,
                  projectId: true,
                },
              }),
              db.serviceConnection.findMany({
                where: {
                  provider: "threads",
                  expiresAt: { not: null, lt: threshold },
                  status: { notIn: ["error", "revoked"] },
                },
                select: {
                  id: true,
                  provider: true,
                  accountEmail: true,
                  accessToken: true,
                  refreshToken: true,
                  expiresAt: true,
                  projectId: true,
                },
              }),
            ]);
          } finally {
            dbSpan.setAttribute("connections.main", 0);
            dbSpan.setAttribute("connections.threads", 0);
            dbSpan.end();
          }
        }
      );

      rootSpan.setAttribute("connections.main", connections.length);
      rootSpan.setAttribute("connections.threads", threadsConnections.length);
      rootSpan.setAttribute("connections.total", connections.length + threadsConnections.length);

      const [mainResults, threadsResults] = await Promise.all([
        Promise.all(connections.map(refreshConnection)),
        Promise.all(
          threadsConnections.map(async (connection): Promise<RefreshResult> => {
            return tracer.startActiveSpan(
              "refresh_connection",
              { attributes: { provider: "threads", "connection.id": connection.id } },
              async (span) => {
                try {
                  await tracer.startActiveSpan(
                    "oauth.fetch_token",
                    { attributes: { provider: "threads" } },
                    async (fetchSpan) => {
                      try {
                        await withTimeout(
                          refreshThreadsTokenForConnection(connection),
                          "threads"
                        );
                      } finally {
                        fetchSpan.end();
                      }
                    }
                  );
                  span.setAttribute("refresh.status", "refreshed");
                  return { status: "refreshed" as const };
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Unknown error";
                  span.setStatus({ code: SpanStatusCode.ERROR, message });
                  span.recordException(err instanceof Error ? err : new Error(message));
                  tokenRefreshFailuresCounter.add(1, { reason: "other", provider: "threads" });
                  return { status: "error" as const, message };
                } finally {
                  span.end();
                }
              }
            );
          })
        ),
      ]);

      let refreshed = 0;
      let failed = 0;
      let revoked = 0;
      const errors: { id: string; provider: string; error: string }[] = [];
      const revokedRows: ConnectionRow[] = [];

      for (let i = 0; i < mainResults.length; i++) {
        const r = mainResults[i];
        if (r.status === "refreshed") refreshed++;
        else if (r.status === "revoked") {
          failed++;
          revoked++;
          revokedRows.push(connections[i]);
          errors.push({ id: connections[i].id, provider: connections[i].provider, error: r.message });
        } else if (r.status === "error") {
          failed++;
          errors.push({
            id: connections[i].id,
            provider: connections[i].provider,
            error: r.message,
          });
        }
      }

      for (let i = 0; i < threadsResults.length; i++) {
        const r = threadsResults[i];
        if (r.status === "refreshed") refreshed++;
        else if (r.status === "error") {
          failed++;
          errors.push({
            id: threadsConnections[i].id,
            provider: "threads",
            error: r.message,
          });
        }
      }

      if (revokedRows.length > 0) {
        try {
          const projectIds = [...new Set(revokedRows.map((c) => c.projectId))];
          const teamMembers = await db.teamMember.findMany({
            where: { projectId: { in: projectIds } },
            select: { userId: true, projectId: true },
          });
          await db.notification.createMany({
            data: revokedRows.flatMap((conn) => {
              const members = teamMembers.filter((m) => m.projectId === conn.projectId);
              return members.map((m) => ({
                userId: m.userId,
                type: "error",
                title: "Требуется повторное подключение",
                message: `Доступ к ${conn.provider} (${conn.accountEmail}) отозван провайдером. Переподключите аккаунт в настройках проекта.`,
              }));
            }),
          });
        } catch {
          // best-effort notifications
        }
      }

      rootSpan.setAttribute("refresh.refreshed", refreshed);
      rootSpan.setAttribute("refresh.failed", failed);
      rootSpan.setAttribute("refresh.revoked", revoked);

      return NextResponse.json({
        refreshed,
        failed,
        revoked,
        total: connections.length + threadsConnections.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } finally {
      rootSpan.end();
    }
  });
}

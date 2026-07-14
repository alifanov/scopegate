import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import type { Prisma } from "@/generated/prisma/client";
import {
  PROVIDER_REGISTRY,
  EXCHANGE_PROVIDER_KEYS,
  getProviderDef,
  type RefreshTokenConfig,
  type ExchangeTokenConfig,
} from "@/lib/provider-registry";

// Serializes all reads+writes for one connection's tokens behind a Postgres
// advisory lock held for the transaction, so concurrent callers (on-demand
// MCP calls, the refresh cron) coalesce onto a single network refresh instead
// of racing a one-time-rotation refresh token (Google, Twitter) into a false
// revoke. The lock is scoped to the connection id, not the row itself, so it
// also serializes against refreshForCron.
async function withConnectionLock<T>(
  connectionId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${connectionId}, 0))`;
      return fn(tx);
    },
    { timeout: 15_000, maxWait: 5_000 }
  );
}

export class OAuthTokenError extends Error {
  readonly provider?: string;
  readonly code?: number;
  readonly permanent?: boolean;

  constructor(
    message: string,
    opts?: { provider?: string; code?: number; permanent?: boolean }
  ) {
    super(message);
    this.name = "OAuthTokenError";
    this.provider = opts?.provider;
    this.code = opts?.code;
    this.permanent = opts?.permanent;
  }
}

// Standard OAuth2 error vocabulary that always means the token is dead,
// regardless of provider. Provider-specific numeric codes (Meta 190/102,
// Twitter 401, ...) live in PROVIDER_REGISTRY[provider].oauthErrors instead.
const GENERIC_PERMANENT_OAUTH_ERRORS = [
  "invalid_grant",
  "invalid_client",
  "unauthorized_client",
  "access_denied",
  "token_revoked",
];

export type OAuthErrorSeverity = "permanent" | "transient";

// Single classifier used by both the on-demand MCP tool-call path
// (handler.ts) and the proactive cron refresh (token-refresh.ts) so a token
// that the cron would tolerate for a few transient failures isn't hard-killed
// the instant an MCP call hits it first.
export function classifyOAuthError(err: unknown): OAuthErrorSeverity {
  if (err instanceof OAuthTokenError) {
    if (err.permanent) return "permanent";
    if (err.code !== undefined && err.provider) {
      const def = getProviderDef(err.provider);
      if (def?.oauthErrors?.permanentCodes?.includes(err.code)) return "permanent";
    }
  }
  const message = err instanceof Error ? err.message : String(err);
  if (GENERIC_PERMANENT_OAUTH_ERRORS.some((marker) => message.includes(marker))) {
    return "permanent";
  }
  return "transient";
}

// Consecutive failures tolerated before a transient error escalates to a full
// revoke — shared circuit-breaker threshold for both call sites.
export const CONSECUTIVE_FAILURES_THRESHOLD = 3;

export async function markConnectionTokenError(
  connectionId: string,
  message: string
): Promise<void> {
  await db.serviceConnection.update({
    where: { id: connectionId },
    data: { status: "error", lastError: message },
  });
}

// Marks a connection as permanently revoked and notifies all project team members.
// Safe to call on an already-revoked connection — skips both the DB write and notifications.
export async function revokeConnectionWithNotification(
  connectionId: string,
  message: string
): Promise<void> {
  // Atomic conditional update: only the caller that actually flips
  // active/error -> revoked proceeds to notify. Concurrent duplicate
  // revokes match zero rows and return early.
  const { count } = await db.serviceConnection.updateMany({
    where: { id: connectionId, status: { not: "revoked" } },
    data: { status: "revoked", lastError: message },
  });
  if (count !== 1) return;

  const conn = await db.serviceConnection.findUnique({
    where: { id: connectionId },
    select: {
      id: true,
      status: true,
      provider: true,
      accountEmail: true,
      projectId: true,
    },
  });
  if (!conn) return;

  const teamMembers = await db.teamMember.findMany({
    where: { projectId: conn.projectId },
    select: { userId: true },
  });
  if (teamMembers.length > 0) {
    await db.notification.createMany({
      data: teamMembers.map((m) => ({
        userId: m.userId,
        type: "error",
        title: "Reconnect required",
        message: `Access to ${conn.provider} (${conn.accountEmail}) has been revoked. Please reconnect the account in project settings.`,
      })),
    });
  }
}

// Applies a transient (not-yet-fatal) OAuth failure on the on-demand path:
// bumps the connection's failure streak and only escalates to a full revoke
// once CONSECUTIVE_FAILURES_THRESHOLD is reached, instead of hard-revoking on
// the very first OAuthTokenError.
export async function recordTransientTokenFailure(
  connectionId: string,
  message: string
): Promise<"revoked" | "error"> {
  const updated = await db.serviceConnection.update({
    where: { id: connectionId },
    data: {
      status: "error",
      lastError: message,
      consecutiveFailures: { increment: 1 },
    },
    select: { consecutiveFailures: true },
  });

  if (updated.consecutiveFailures >= CONSECUTIVE_FAILURES_THRESHOLD) {
    await revokeConnectionWithNotification(connectionId, message);
    return "revoked";
  }
  return "error";
}

const tracer = trace.getTracer("scopegate/oauth-token-lifecycle");

type StandardTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

async function exchangeMetaToken(
  currentToken: string,
  appId: string,
  appSecret: string
): Promise<StandardTokenResponse> {
  return tracer.startActiveSpan(
    "GET graph.facebook.com",
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "http.method": "GET",
        "mcp.provider": "metaAds",
        "peer.service": "graph.facebook.com",
        "url.path": "/v21.0/oauth/access_token",
      },
    },
    async (span) => {
      try {
        const params = new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: currentToken,
        });
        const res = await fetch(
          `https://graph.facebook.com/v21.0/oauth/access_token?${params}`
        );
        span.setAttribute("http.status_code", res.status);

        if (!res.ok) {
          let code: number | undefined;
          let detail = "";
          try {
            const body = (await res.json()) as {
              error?: { code?: number; message?: string };
            };
            code = body.error?.code;
            detail = body.error?.message ?? "";
          } catch {
            // non-JSON error body — fall through with status only
          }

          if (code != null) {
            span.setAttribute("error.code", code);
            span.setAttribute("error.type", String(code));
          } else {
            span.setAttribute("error.type", String(res.status));
          }
          if (detail) span.setAttribute("error.message", detail.slice(0, 512));
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${res.status}` });

          throw new OAuthTokenError(
            `Meta token exchange failed (${res.status})` +
              (code != null ? ` code=${code}` : "") +
              (detail ? `: ${detail}` : ""),
            { provider: "metaAds", code }
          );
        }

        return res.json() as Promise<StandardTokenResponse>;
      } catch (err) {
        if (!(err instanceof OAuthTokenError)) {
          const message = err instanceof Error ? err.message : "Unknown Meta token exchange error";
          span.setStatus({ code: SpanStatusCode.ERROR, message });
          span.recordException(err instanceof Error ? err : new Error(message));
        }
        throw err;
      } finally {
        span.end();
      }
    }
  );
}

type ProviderConfig =
  | { kind: "static" }
  | {
      kind: "refresh";
      bufferMs: number;
      doRefresh: (refreshToken: string) => Promise<StandardTokenResponse>;
    }
  | {
      kind: "exchange";
      bufferMs: number;
      // Throws OAuthTokenError on failure. The cron path (refreshForCron) lets the
      // throw drive the circuit breaker (status/backoff); the on-demand path
      // (getValidAccessTokenForConnection) catches it and falls back to the current token.
      doExchange: (currentToken: string) => Promise<StandardTokenResponse>;
    };

function buildDoRefresh(
  displayName: string,
  t: RefreshTokenConfig
): (refreshToken: string) => Promise<StandardTokenResponse> {
  return async (refreshToken: string) => {
    const clientId = process.env[t.clientIdEnv]!;
    const clientSecret = process.env[t.clientSecretEnv]!;

    let headers: Record<string, string>;
    let body: string;

    if (t.authStyle === "basic") {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      };
      body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString();
    } else if (t.bodyFormat === "json") {
      headers = { "Content-Type": "application/json" };
      body = JSON.stringify({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      });
    } else {
      headers = { "Content-Type": "application/x-www-form-urlencoded" };
      body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString();
    }

    const fetchOpts: RequestInit = { method: "POST", headers, body };
    if (t.timeoutMs !== undefined) fetchOpts.signal = AbortSignal.timeout(t.timeoutMs);

    const res = await fetch(t.tokenUrl, fetchOpts);
    if (!res.ok) throw new OAuthTokenError(`${displayName} token refresh failed (${res.status})`);

    const data = (await res.json()) as StandardTokenResponse;
    if (t.defaultExpiresInMs !== undefined && !data.expires_in) {
      return { ...data, expires_in: t.defaultExpiresInMs / 1000 };
    }
    return data;
  };
}

function getProviderConfig(provider: string): ProviderConfig {
  const def = PROVIDER_REGISTRY.find((p) => p.key === provider);
  if (!def) throw new Error(`Unknown OAuth provider: ${provider}`);

  const t = def.token;

  if (t.kind === "static") return { kind: "static" };

  if (t.kind === "refresh") {
    return {
      kind: "refresh",
      bufferMs: t.bufferMs,
      doRefresh: buildDoRefresh(def.displayName, t),
    };
  }

  // kind === "exchange"
  const et = t as ExchangeTokenConfig;

  if (et.exchangeType === "meta") {
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    return {
      kind: "exchange",
      bufferMs: et.bufferMs,
      doExchange: (currentToken) => exchangeMetaToken(currentToken, appId, appSecret),
    };
  }

  // threads
  return {
    kind: "exchange",
    bufferMs: et.bufferMs,
    doExchange: async (currentToken) => {
      const params = new URLSearchParams({
        grant_type: "th_refresh_token",
        access_token: currentToken,
      });
      const res = await fetch(`https://graph.threads.net/refresh_access_token?${params}`);
      if (!res.ok) throw new OAuthTokenError(`Threads token refresh failed (${res.status})`);
      return res.json() as Promise<StandardTokenResponse>;
    },
  };
}

type DbConnection = Awaited<ReturnType<typeof db.serviceConnection.findUniqueOrThrow>>;

export async function getValidAccessToken(connectionId: string): Promise<string> {
  const conn = await db.serviceConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });
  return getValidAccessTokenForConnection(conn);
}

function needsRefresh(
  expiresAt: Date | null,
  bufferMs: number
): boolean {
  return !expiresAt || expiresAt.getTime() < Date.now() + bufferMs;
}

export async function getValidAccessTokenForConnection(conn: DbConnection): Promise<string> {
  if (conn.status === "revoked") {
    throw new OAuthTokenError(
      `Connection ${conn.id} (${conn.provider}) is revoked — reconnect required`,
      { permanent: true }
    );
  }

  const config = getProviderConfig(conn.provider);

  if (config.kind === "static") {
    return decrypt(conn.accessToken);
  }

  if (!needsRefresh(conn.expiresAt, config.bufferMs)) {
    return decrypt(conn.accessToken);
  }

  // Serialize on the connection id: a concurrent caller that wins the lock
  // first performs the refresh; everyone else re-reads the now-fresh row
  // once they acquire the lock and skips the network call entirely.
  return withConnectionLock(conn.id, async (tx) => {
    const fresh = await tx.serviceConnection.findUniqueOrThrow({ where: { id: conn.id } });

    if (fresh.status === "revoked") {
      throw new OAuthTokenError(
        `Connection ${fresh.id} (${fresh.provider}) is revoked — reconnect required`,
        { permanent: true }
      );
    }

    if (!needsRefresh(fresh.expiresAt, config.bufferMs)) {
      return decrypt(fresh.accessToken);
    }

    if (config.kind === "exchange") {
      const currentToken = decrypt(fresh.accessToken);
      let result: StandardTokenResponse;
      try {
        result = await config.doExchange(currentToken);
      } catch {
        // On-demand resilience: fall back to the current token if the exchange
        // fails. The cron path (refreshForCron) owns status/backoff via the breaker.
        return currentToken;
      }
      await tx.serviceConnection.update({
        where: { id: fresh.id },
        data: {
          accessToken: encrypt(result.access_token),
          expiresAt: new Date(Date.now() + result.expires_in * 1000),
          status: "active",
          lastError: null,
        },
      });
      return result.access_token;
    }

    // kind === "refresh"
    if (!fresh.refreshToken) {
      throw new OAuthTokenError(
        `No refresh token available for connection ${fresh.id} (${fresh.provider})`,
        { permanent: true }
      );
    }
    const tokens = await config.doRefresh(decrypt(fresh.refreshToken));
    const updateData: Record<string, unknown> = {
      accessToken: encrypt(tokens.access_token),
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      status: "active",
      lastError: null,
    };
    if (tokens.refresh_token) {
      updateData.refreshToken = encrypt(tokens.refresh_token);
    }
    await tx.serviceConnection.update({ where: { id: fresh.id }, data: updateData });
    return tokens.access_token;
  });
}

export type RefreshForCronOutcome = "refreshed" | "skipped";

export type CronConnection = {
  id: string;
  provider: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
};

// Performs a proactive token refresh for cron use. Resets consecutiveFailures on success.
// Returns "skipped" for static tokens (nothing to refresh).
// Throws on refresh/exchange failure — callers apply error state + backoff (circuit breaker).
export async function refreshForCron(
  connection: CronConnection
): Promise<RefreshForCronOutcome> {
  const config = getProviderConfig(connection.provider);

  if (config.kind === "static") return "skipped";

  // Same lock as the on-demand path: if a concurrent on-demand refresh already
  // rotated the token by the time cron acquires the lock, re-check and skip
  // rather than firing a redundant (and for one-time-rotation providers,
  // failing) network refresh.
  return withConnectionLock(connection.id, async (tx) => {
    const fresh = await tx.serviceConnection.findUniqueOrThrow({
      where: { id: connection.id },
    });

    if (fresh.status === "revoked") return "skipped";
    if (!needsRefresh(fresh.expiresAt, config.bufferMs)) return "skipped";

    if (config.kind === "exchange") {
      const currentToken = decrypt(fresh.accessToken);
      const result = await config.doExchange(currentToken);
      await tx.serviceConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: encrypt(result.access_token),
          expiresAt: new Date(Date.now() + result.expires_in * 1000),
          status: "active",
          lastError: null,
          consecutiveFailures: 0,
        },
      });
      return "refreshed";
    }

    // kind === "refresh"
    if (!fresh.refreshToken) return "skipped";

    const tokens = await config.doRefresh(decrypt(fresh.refreshToken));
    const updateData: Record<string, unknown> = {
      accessToken: encrypt(tokens.access_token),
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      status: "active",
      lastError: null,
      consecutiveFailures: 0,
    };
    if (tokens.refresh_token) {
      updateData.refreshToken = encrypt(tokens.refresh_token);
    }
    await tx.serviceConnection.update({ where: { id: connection.id }, data: updateData });
    return "refreshed";
  });
}

export { EXCHANGE_PROVIDER_KEYS as EXCHANGE_PROVIDERS };

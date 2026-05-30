import { NextResponse } from "next/server";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { db } from "@/lib/db";
import { refreshAccessToken } from "@/lib/google-oauth";
import { refreshLinkedInAccessToken } from "@/lib/linkedin-oauth";
import { refreshThreadsTokenForConnection } from "@/lib/threads-oauth";
import { encrypt, decrypt } from "@/lib/crypto";

const tracer = trace.getTracer("scopegate/cron/refresh-tokens");

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
  | { status: "error"; message: string };

type ConnectionRow = {
  id: string;
  provider: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
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
        try {
          await db.serviceConnection.update({
            where: { id: connection.id },
            data: { status: "error", lastError: message },
          });
        } catch {
          // best-effort status update
        }
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
                },
                select: {
                  id: true,
                  provider: true,
                  accessToken: true,
                  refreshToken: true,
                  expiresAt: true,
                },
              }),
              db.serviceConnection.findMany({
                where: {
                  provider: "threads",
                  expiresAt: { not: null, lt: threshold },
                  status: { not: "error" },
                },
                select: {
                  id: true,
                  provider: true,
                  accessToken: true,
                  refreshToken: true,
                  expiresAt: true,
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
      const errors: { id: string; provider: string; error: string }[] = [];

      for (let i = 0; i < mainResults.length; i++) {
        const r = mainResults[i];
        if (r.status === "refreshed") refreshed++;
        else if (r.status === "error") {
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

      rootSpan.setAttribute("refresh.refreshed", refreshed);
      rootSpan.setAttribute("refresh.failed", failed);

      return NextResponse.json({
        refreshed,
        failed,
        total: connections.length + threadsConnections.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } finally {
      rootSpan.end();
    }
  });
}

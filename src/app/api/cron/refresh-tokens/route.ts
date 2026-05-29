import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshAccessToken } from "@/lib/google-oauth";
import { refreshLinkedInAccessToken } from "@/lib/linkedin-oauth";
import { getValidThreadsAccessToken } from "@/lib/threads-oauth";
import { encrypt, decrypt } from "@/lib/crypto";

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

async function refreshConnection(connection: {
  id: string;
  provider: string;
  refreshToken: string | null;
}): Promise<RefreshResult> {
  try {
    if (!connection.refreshToken) return { status: "skipped" };
    const decryptedRefreshToken = decrypt(connection.refreshToken);

    if (GOOGLE_PROVIDERS.has(connection.provider)) {
      const tokens = await withTimeout(
        refreshAccessToken(decryptedRefreshToken),
        connection.provider
      );
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      await db.serviceConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: encrypt(tokens.access_token),
          expiresAt,
          status: "active",
          lastError: null,
        },
      });
      return { status: "refreshed" };
    }

    if (connection.provider === "linkedin") {
      const tokens = await withTimeout(
        refreshLinkedInAccessToken(decryptedRefreshToken),
        "linkedin"
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
      await db.serviceConnection.update({
        where: { id: connection.id },
        data: updateData,
      });
      return { status: "refreshed" };
    }

    return { status: "skipped" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    try {
      await db.serviceConnection.update({
        where: { id: connection.id },
        data: { status: "error", lastError: message },
      });
    } catch {
      // best-effort status update
    }
    return { status: "error", message };
  }
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

  const bufferMs = 10 * 60 * 1000;
  const threshold = new Date(Date.now() + bufferMs);

  const [connections, threadsConnections] = await Promise.all([
    db.serviceConnection.findMany({
      where: {
        refreshToken: { not: null },
        expiresAt: { not: null, lt: threshold },
      },
    }),
    db.serviceConnection.findMany({
      where: {
        provider: "threads",
        expiresAt: { not: null, lt: threshold },
        status: { not: "error" },
      },
    }),
  ]);

  const [mainResults, threadsResults] = await Promise.all([
    Promise.all(connections.map(refreshConnection)),
    Promise.all(
      threadsConnections.map(async (connection): Promise<RefreshResult> => {
        try {
          await withTimeout(
            getValidThreadsAccessToken(connection.id),
            "threads"
          );
          return { status: "refreshed" };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          try {
            await db.serviceConnection.update({
              where: { id: connection.id },
              data: { status: "error", lastError: message },
            });
          } catch {
            // best-effort status update
          }
          return { status: "error", message };
        }
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

  return NextResponse.json({
    refreshed,
    failed,
    total: connections.length + threadsConnections.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

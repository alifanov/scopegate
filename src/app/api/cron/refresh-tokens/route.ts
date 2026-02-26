import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshAccessToken } from "@/lib/google-oauth";
import { refreshLinkedInAccessToken } from "@/lib/linkedin-oauth";
import { encrypt, decrypt } from "@/lib/crypto";

const GOOGLE_PROVIDERS = new Set([
  "gmail",
  "calendar",
  "drive",
  "googleAds",
  "searchConsole",
]);

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${cronSecret}`;
  if (authHeader?.trim() !== expected) {
    console.error("[ScopeGate] Cron auth mismatch", {
      receivedLength: authHeader?.length,
      expectedLength: expected.length,
      match: authHeader === expected,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bufferMs = 10 * 60 * 1000; // 10 minutes
  const threshold = new Date(Date.now() + bufferMs);

  // Find connections with refresh tokens expiring within 10 minutes
  const connections = await db.serviceConnection.findMany({
    where: {
      refreshToken: { not: null },
      expiresAt: { not: null, lt: threshold },
    },
  });

  let refreshed = 0;
  let failed = 0;
  const errors: { id: string; provider: string; error: string }[] = [];

  for (const connection of connections) {
    try {
      const decryptedRefreshToken = decrypt(connection.refreshToken!);

      if (GOOGLE_PROVIDERS.has(connection.provider)) {
        const tokens = await refreshAccessToken(decryptedRefreshToken);
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
      } else if (connection.provider === "linkedin") {
        const tokens =
          await refreshLinkedInAccessToken(decryptedRefreshToken);
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
      } else {
        // Skip providers without refresh logic (API key providers)
        continue;
      }

      refreshed++;
    } catch (err) {
      failed++;
      const message =
        err instanceof Error ? err.message : "Unknown error";
      errors.push({
        id: connection.id,
        provider: connection.provider,
        error: message,
      });

      await db.serviceConnection.update({
        where: { id: connection.id },
        data: {
          status: "error",
          lastError: message,
        },
      });
    }
  }

  return NextResponse.json({
    refreshed,
    failed,
    total: connections.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

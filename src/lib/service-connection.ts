import { db } from "@/lib/db";
import type { Prisma, ServiceConnection, ServiceProvider } from "@/generated/prisma/client";

export interface UpsertServiceConnectionInput {
  projectId: string;
  provider: ServiceProvider;
  accountEmail: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt?: Date | null;
  metadata?: Prisma.InputJsonValue | null;
}

type ServiceConnectionDatabase = Pick<typeof db.serviceConnection, "upsert">;

// Single seam for all three ways a ServiceConnection gets created/reconnected
// (OAuth callback, API key form, email IMAP/SMTP form). A successful
// reconnect means the account is healthy again, so this always clears
// consecutiveFailures and reactivates status — otherwise a manually
// reconnected account keeps its old failure count and a single subsequent
// hiccup can immediately re-trip the auto-revoke threshold.
export async function upsertServiceConnection(
  input: UpsertServiceConnectionInput,
  database: ServiceConnectionDatabase = db.serviceConnection
): Promise<ServiceConnection> {
  const { projectId, provider, accountEmail, accessToken, refreshToken, metadata } = input;

  return database.upsert({
    where: { projectId_provider_accountEmail: { projectId, provider, accountEmail } },
    update: {
      accessToken,
      refreshToken,
      status: "active",
      lastError: null,
      consecutiveFailures: 0,
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      ...(metadata != null ? { metadata } : {}),
    },
    create: {
      projectId,
      provider,
      accountEmail,
      accessToken,
      refreshToken,
      expiresAt: input.expiresAt ?? null,
      metadata: metadata ?? undefined,
    },
  });
}

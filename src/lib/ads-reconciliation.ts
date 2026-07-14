import { db } from "@/lib/db";
import { stripPendingAccountEmail } from "@/lib/mcp/google-ads";

type ServiceConnectionRow = {
  id: string;
  projectId: string;
  provider: string;
  accountEmail: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  metadata: unknown;
};

type AdsReconciliationDatabase = {
  serviceConnection: Pick<
    typeof db.serviceConnection,
    "findMany" | "update" | "delete"
  >;
};

type TransactionRunner = <T>(
  fn: (tx: AdsReconciliationDatabase) => Promise<T>
) => Promise<T>;

async function defaultTransaction<T>(
  fn: (tx: AdsReconciliationDatabase) => Promise<T>
): Promise<T> {
  return db.$transaction((tx) => fn(tx));
}

type ReconcileOptions = {
  database?: AdsReconciliationDatabase;
  transaction?: TransactionRunner;
};

/**
 * Links a Google Ads customer to a service connection. If another connection
 * in the project already tracks the same customer (a prior connect flow that
 * created a "#pending:"-suffixed temp connection), merges the fresh tokens
 * onto that existing connection and drops the temp one instead of creating a
 * duplicate.
 */
export async function reconcileAdsCustomer(
  connection: ServiceConnectionRow,
  customerId: string,
  customerName: string | undefined,
  { database = db, transaction = defaultTransaction }: ReconcileOptions = {}
): Promise<void> {
  const cleanAccountEmail = stripPendingAccountEmail(connection.accountEmail);

  const siblings = await database.serviceConnection.findMany({
    where: {
      projectId: connection.projectId,
      provider: connection.provider,
      accountEmail: cleanAccountEmail,
      id: { not: connection.id },
    },
  });
  const duplicate = siblings.find(
    (c) => (c.metadata as Record<string, unknown> | null)?.googleAdsCustomerId === customerId
  );

  if (duplicate) {
    // Reconnecting an existing account — refresh tokens on the existing record, remove temp.
    // Atomic: a crash between the two writes would otherwise orphan the temp connection.
    const dupMeta = duplicate.metadata as Record<string, unknown> | null;
    await transaction(async (tx) => {
      await tx.serviceConnection.update({
        where: { id: duplicate.id },
        data: {
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken,
          expiresAt: connection.expiresAt,
          status: "active",
          lastError: null,
          metadata: {
            ...(dupMeta ?? {}),
            googleAdsCustomerId: customerId,
            ...(customerName ? { googleAdsCustomerName: customerName } : {}),
          },
        },
      });
      await tx.serviceConnection.delete({ where: { id: connection.id } });
    });
    return;
  }

  const metadata = connection.metadata as Record<string, unknown> | null;
  await database.serviceConnection.update({
    where: { id: connection.id },
    data: {
      accountEmail: cleanAccountEmail,
      metadata: {
        ...(metadata ?? {}),
        googleAdsCustomerId: customerId,
        ...(customerName ? { googleAdsCustomerName: customerName } : {}),
      },
    },
  });
}

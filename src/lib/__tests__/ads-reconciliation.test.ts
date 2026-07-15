import { beforeEach, describe, expect, it, vi } from "vitest";
import { reconcileAdsCustomer } from "../ads-reconciliation";

vi.mock("@/lib/mcp/google-ads", () => ({
  googleAdsAccountEmail: (email: string, customerId: string) =>
    `${email.replace(/#pending:.*$/, "")} (${customerId})`,
}));

const database = {
  serviceConnection: { findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
};

function transaction<T>(fn: (tx: typeof database) => Promise<T>): Promise<T> {
  return fn(database);
}

const baseConnection = {
  id: "temp-1",
  projectId: "p1",
  provider: "googleAds" as const,
  accountEmail: "user@example.com#pending:temp-1",
  accessToken: "at",
  refreshToken: "rt",
  expiresAt: null,
  metadata: {},
};

describe("reconcileAdsCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges into an existing sibling connection and deletes the temp one atomically", async () => {
    database.serviceConnection.findMany.mockResolvedValue([
      { id: "existing-1", metadata: { googleAdsCustomerId: "123" } },
    ]);
    database.serviceConnection.update.mockResolvedValue({ id: "existing-1" });
    database.serviceConnection.delete.mockResolvedValue({ id: "temp-1" });

    await reconcileAdsCustomer(baseConnection, "123", undefined, {
      database,
      transaction,
    });

    expect(database.serviceConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "existing-1" } })
    );
    expect(database.serviceConnection.delete).toHaveBeenCalledWith({
      where: { id: "temp-1" },
    });
  });

  it("propagates a failed transaction instead of silently orphaning the temp connection", async () => {
    database.serviceConnection.findMany.mockResolvedValue([
      { id: "existing-1", metadata: { googleAdsCustomerId: "123" } },
    ]);
    const failingTransaction = vi.fn().mockRejectedValue(new Error("db exploded"));

    await expect(
      reconcileAdsCustomer(baseConnection, "123", undefined, {
        database,
        transaction: failingTransaction,
      })
    ).rejects.toThrow("db exploded");
  });

  it("updates the connection in place when no sibling tracks the same customer", async () => {
    database.serviceConnection.findMany.mockResolvedValue([]);
    database.serviceConnection.update.mockResolvedValue({ id: "temp-1" });

    await reconcileAdsCustomer(baseConnection, "456", "My Account", {
      database,
      transaction,
    });

    expect(database.serviceConnection.delete).not.toHaveBeenCalled();
    expect(database.serviceConnection.update).toHaveBeenCalledWith({
      where: { id: "temp-1" },
      data: {
        accountEmail: "user@example.com (456)",
        metadata: { googleAdsCustomerId: "456", googleAdsCustomerName: "My Account" },
      },
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { applyCustomerState } from "../billing";

const PRO_PRODUCT = "prod_pro_123";
const TEAM_PRODUCT = "prod_team_456";

function fakeDb() {
  return { user: { update: vi.fn().mockResolvedValue({}) } };
}

describe("applyCustomerState", () => {
  beforeEach(() => {
    vi.stubEnv("POLAR_PRODUCT_PRO", PRO_PRODUCT);
    vi.stubEnv("POLAR_PRODUCT_TEAM", TEAM_PRODUCT);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("writes the plan matching the active subscription's product", async () => {
    const database = fakeDb();
    const result = await applyCustomerState(
      {
        id: "cus_1",
        externalId: "user-1",
        activeSubscriptions: [
          { productId: PRO_PRODUCT, status: "active", currentPeriodEnd: "2026-09-01T00:00:00Z" },
        ],
      },
      { database: database as never },
    );

    expect(result).toEqual({ applied: true, planSlug: "pro" });
    expect(database.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        polarCustomerId: "cus_1",
        planSlug: "pro",
        planStatus: "active",
        planValidUntil: new Date("2026-09-01T00:00:00Z"),
      },
    });
  });

  it("falls back to free when there are no active subscriptions", async () => {
    const database = fakeDb();
    const result = await applyCustomerState(
      { id: "cus_1", externalId: "user-1", activeSubscriptions: [] },
      { database: database as never },
    );

    expect(result.planSlug).toBe("free");
    expect(database.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planSlug: "free", planValidUntil: null }),
      }),
    );
  });

  // Polar permits several concurrent subscriptions; array order is not a
  // contract, so the outcome must not depend on it.
  it("picks the highest-priced plan deterministically", async () => {
    const database = fakeDb();
    await applyCustomerState(
      {
        id: "cus_1",
        externalId: "user-1",
        activeSubscriptions: [
          { productId: PRO_PRODUCT, status: "active" },
          { productId: TEAM_PRODUCT, status: "active" },
        ],
      },
      { database: database as never },
    );

    expect(database.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ planSlug: "team" }) }),
    );
  });

  it("ignores products that map to no known plan", async () => {
    const database = fakeDb();
    const result = await applyCustomerState(
      {
        id: "cus_1",
        externalId: "user-1",
        activeSubscriptions: [{ productId: "prod_unknown", status: "active" }],
      },
      { database: database as never },
    );

    expect(result.planSlug).toBe("free");
  });

  // Without externalId there is no way to attribute the state to an account;
  // guessing would be worse than dropping the event.
  it("does not touch the database when externalId is missing", async () => {
    const database = fakeDb();
    const result = await applyCustomerState(
      { id: "cus_1", externalId: null, activeSubscriptions: [] },
      { database: database as never },
    );

    expect(result).toEqual({ applied: false, planSlug: null });
    expect(database.user.update).not.toHaveBeenCalled();
  });

  it("survives an unparseable period end", async () => {
    const database = fakeDb();
    await applyCustomerState(
      {
        id: "cus_1",
        externalId: "user-1",
        activeSubscriptions: [
          { productId: PRO_PRODUCT, status: "active", currentPeriodEnd: "not-a-date" },
        ],
      },
      { database: database as never },
    );

    expect(database.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ planValidUntil: null }) }),
    );
  });
});

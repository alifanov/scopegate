import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const db = {
    teamMember: { findUnique: vi.fn() },
    serviceConnection: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(db)),
  };
  return { db };
});

vi.mock("@/lib/auth-middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-middleware")>();
  return {
    ...actual,
    requireCurrentUser: vi.fn(),
  };
});

vi.mock("@/lib/mcp/google-ads", () => ({
  listAccessibleCustomers: vi.fn(),
  googleAdsAccountEmail: (email: string, customerId: string) =>
    `${email.replace(/#pending:.*$/, "")} (${customerId})`,
}));

import { POST } from "../route";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-middleware";
import { PROJECT_ROLE } from "@/lib/project-roles";

const mockGetCurrentUser = vi.mocked(requireCurrentUser);
const mockTeamMemberFindUnique = vi.mocked(db.teamMember.findUnique);
const mockConnectionFindFirst = vi.mocked(db.serviceConnection.findFirst);
const mockConnectionFindMany = vi.mocked(db.serviceConnection.findMany);
const mockConnectionUpdate = vi.mocked(db.serviceConnection.update);
const mockConnectionDelete = vi.mocked(db.serviceConnection.delete);
const mockTransaction = vi.mocked(db.$transaction);

function makeParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/projects/p1/services/ads-customers", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("ads-customers route – duplicate-merge atomicity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
    mockTeamMemberFindUnique.mockResolvedValue({
      id: "tm-1",
      role: PROJECT_ROLE.owner,
    } as never);
    mockConnectionFindFirst.mockResolvedValue({
      id: "temp-1",
      projectId: "p1",
      provider: "googleAds",
      accountEmail: "user@example.com#pending:temp-1",
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: null,
      metadata: {},
    } as never);
  });

  it("merges duplicate + deletes the temp connection in a single transaction", async () => {
    mockConnectionFindMany.mockResolvedValue([
      { id: "existing-1", metadata: { googleAdsCustomerId: "123" } },
    ] as never);
    mockConnectionUpdate.mockResolvedValue({ id: "existing-1" } as never);
    mockConnectionDelete.mockResolvedValue({ id: "temp-1" } as never);

    const res = await POST(
      makeRequest({ connectionId: "temp-1", customerId: "123" }),
      makeParams("p1")
    );

    expect(res.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockConnectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "existing-1" } })
    );
    expect(mockConnectionDelete).toHaveBeenCalledWith({ where: { id: "temp-1" } });
  });

  it("surfaces the error instead of leaving an orphaned temp connection when the transaction fails", async () => {
    mockConnectionFindMany.mockResolvedValue([
      { id: "existing-1", metadata: { googleAdsCustomerId: "123" } },
    ] as never);
    mockConnectionUpdate.mockResolvedValue({ id: "existing-1" } as never);
    mockConnectionDelete.mockResolvedValue({ id: "temp-1" } as never);
    mockTransaction.mockRejectedValue(new Error("db exploded"));

    await expect(
      POST(makeRequest({ connectionId: "temp-1", customerId: "123" }), makeParams("p1"))
    ).rejects.toThrow("db exploded");
  });
});

import { describe, it, expect, vi } from "vitest";
import {
  assertWithinLimit,
  currentMonth,
  PlanLimitError,
  resolveProjectOwnerId,
} from "../plan-limits";

function fakeDb({
  planSlug = "free",
  projects = 0,
  endpoints = 0,
  owner = "owner-1",
}: {
  planSlug?: string;
  projects?: number;
  endpoints?: number;
  owner?: string | null;
} = {}) {
  return {
    user: { findUnique: vi.fn().mockResolvedValue({ planSlug }) },
    teamMember: {
      count: vi.fn().mockResolvedValue(projects),
      findFirst: vi.fn().mockResolvedValue(owner ? { userId: owner } : null),
    },
    mcpEndpoint: { count: vi.fn().mockResolvedValue(endpoints) },
  };
}

describe("assertWithinLimit", () => {
  it("does nothing at all when not in cloud mode", async () => {
    const database = fakeDb({ planSlug: "free", projects: 999 });
    await expect(
      assertWithinLimit("owner-1", "projects", { database: database as never, cloud: false }),
    ).resolves.toBeUndefined();
    // Not merely permissive — self-hosted must not pay for the queries either.
    expect(database.user.findUnique).not.toHaveBeenCalled();
  });

  it("allows a free user under the project ceiling", async () => {
    await expect(
      assertWithinLimit("owner-1", "projects", {
        database: fakeDb({ planSlug: "free", projects: 0 }) as never,
        cloud: true,
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects a free user at the project ceiling", async () => {
    await expect(
      assertWithinLimit("owner-1", "projects", {
        database: fakeDb({ planSlug: "free", projects: 1 }) as never,
        cloud: true,
      }),
    ).rejects.toBeInstanceOf(PlanLimitError);
  });

  it("counts endpoints across every project the user owns", async () => {
    await expect(
      assertWithinLimit("owner-1", "endpoints", {
        database: fakeDb({ planSlug: "free", endpoints: 5 }) as never,
        cloud: true,
      }),
    ).rejects.toThrow(/5 MCP endpoints/);
  });

  it("never limits an unlimited plan", async () => {
    await expect(
      assertWithinLimit("owner-1", "projects", {
        database: fakeDb({ planSlug: "team", projects: 10_000 }) as never,
        cloud: true,
      }),
    ).resolves.toBeUndefined();
  });

  it("treats an unknown plan slug as free rather than throwing", async () => {
    await expect(
      assertWithinLimit("owner-1", "projects", {
        database: fakeDb({ planSlug: "plan-that-was-deleted", projects: 1 }) as never,
        cloud: true,
      }),
    ).rejects.toBeInstanceOf(PlanLimitError);
  });

  it("carries a 402 so authErrorResponse maps it without extra wiring", async () => {
    const error = await assertWithinLimit("owner-1", "projects", {
      database: fakeDb({ planSlug: "free", projects: 1 }) as never,
      cloud: true,
    }).catch((e) => e);
    expect(error.status).toBe(402);
  });
});

describe("resolveProjectOwnerId", () => {
  it("returns the owner", async () => {
    await expect(
      resolveProjectOwnerId("p1", { database: fakeDb({ owner: "owner-9" }) }),
    ).resolves.toBe("owner-9");
  });

  it("returns null for a project with no owner row", async () => {
    await expect(
      resolveProjectOwnerId("p1", { database: fakeDb({ owner: null }) }),
    ).resolves.toBeNull();
  });
});

describe("currentMonth", () => {
  it("formats as YYYY-MM in UTC and zero-pads", () => {
    expect(currentMonth(new Date("2026-08-12T22:00:00Z"))).toBe("2026-08");
    expect(currentMonth(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01");
  });

  it("uses UTC, not local time, so the bucket does not shift per server", () => {
    expect(currentMonth(new Date("2026-08-31T23:30:00Z"))).toBe("2026-08");
    expect(currentMonth(new Date("2026-09-01T00:30:00Z"))).toBe("2026-09");
  });
});

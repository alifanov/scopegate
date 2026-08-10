import { beforeEach, describe, expect, it, vi } from "vitest";

const span = {
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
};

vi.mock("@opentelemetry/api", () => ({
  SpanStatusCode: { ERROR: 2 },
  metrics: {
    getMeter: () => ({
      createCounter: () => ({ add: vi.fn() }),
    }),
  },
  trace: {
    getTracer: () => ({
      startActiveSpan: (
        _name: string,
        optionsOrCallback: unknown,
        maybeCallback?: unknown
      ) => {
        const callback =
          typeof optionsOrCallback === "function"
            ? optionsOrCallback
            : maybeCallback;
        return (callback as (activeSpan: typeof span) => unknown)(span);
      },
    }),
  },
}));

vi.mock("@/lib/oauth-token-lifecycle", async (importOriginal) => {
  // Keep the real classifyOAuthError/OAuthTokenError/CONSECUTIVE_FAILURES_THRESHOLD
  // (pure, provider-registry-driven — no DB access) so this suite exercises the
  // actual shared classifier instead of re-implementing it. Only the network-hitting
  // refreshForCron is stubbed.
  const actual = await importOriginal<typeof import("@/lib/oauth-token-lifecycle")>();
  return {
    ...actual,
    EXCHANGE_PROVIDERS: ["metaAds"],
    refreshForCron: vi.fn(),
  };
});

import {
  refreshConnectionToken,
  refreshExpiringConnectionTokens,
  type RefreshConnectionRow,
} from "../token-refresh";
import { refreshForCron, OAuthTokenError, classifyOAuthError } from "@/lib/oauth-token-lifecycle";

const database = {
  serviceConnection: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  teamMember: { findMany: vi.fn() },
  notification: { createMany: vi.fn() },
};

const connection: RefreshConnectionRow = {
  id: "connection-1",
  provider: "metaAds",
  accountEmail: "user@example.com",
  accessToken: "encrypted-access",
  refreshToken: null,
  expiresAt: new Date("2026-06-22T12:00:00.000Z"),
  projectId: "project-1",
  consecutiveFailures: 0,
};

describe("token refresh service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifies structured Meta token-exchange errors as permanent, generic failures as transient", () => {
    expect(
      classifyOAuthError(
        new OAuthTokenError("Meta token exchange failed code=190", {
          provider: "metaAds",
          code: 190,
        })
      )
    ).toBe("permanent");
    expect(classifyOAuthError(new Error("network timeout"))).toBe("transient");
  });

  it("marks permanent refresh errors as revoked", async () => {
    vi.mocked(refreshForCron).mockRejectedValue(
      new OAuthTokenError("Meta token exchange failed code=190", {
        provider: "metaAds",
        code: 190,
      })
    );

    const result = await refreshConnectionToken(connection, database);

    expect(result).toEqual({
      status: "revoked",
      message: "Meta token exchange failed code=190",
    });
    expect(database.serviceConnection.update).toHaveBeenCalledWith({
      where: { id: "connection-1" },
      data: {
        status: "revoked",
        lastError: "Meta token exchange failed code=190",
        consecutiveFailures: 0,
      },
    });
  });

  it("summarizes refresh outcomes and creates notifications for revoked rows", async () => {
    database.serviceConnection.findMany.mockResolvedValue([
      connection,
      { ...connection, id: "connection-2", provider: "google" },
    ]);
    database.teamMember.findMany.mockResolvedValue([
      { userId: "user-1", projectId: "project-1" },
    ]);
    database.notification.createMany.mockResolvedValue({ count: 1 });

    const summary = await refreshExpiringConnectionTokens({
      database,
      now: new Date("2026-06-22T11:55:00.000Z"),
      refreshConnectionToken: vi
        .fn()
        .mockResolvedValueOnce({ status: "refreshed" })
        .mockResolvedValueOnce({ status: "revoked", message: "invalid_grant" }),
    });

    expect(summary).toEqual({
      refreshed: 1,
      skipped: 0,
      failed: 1,
      revoked: 1,
      total: 2,
      errors: [{ id: "connection-2", provider: "google", error: "invalid_grant" }],
    });
    expect(database.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: "user-1",
          title: "Reconnect required",
        }),
      ],
    });
  });

  it("keeps errored connections in scope and windows each provider by its own buffer", async () => {
    database.serviceConnection.findMany.mockResolvedValue([]);
    const now = new Date("2026-06-22T12:00:00.000Z");

    await refreshExpiringConnectionTokens({ database, now });

    const { where } = database.serviceConnection.findMany.mock.calls[0][0];

    // Only "revoked" is excluded — an earlier transient failure ("error") must
    // still be retried, otherwise the failure streak never reaches the threshold.
    expect(where.status).toEqual({ not: "revoked" });

    // Meta's 24h buffer and the 5-min refresh-token buffer produce distinct windows,
    // and a null expiresAt always counts as due.
    const windows = where.OR as {
      provider: { in: string[] };
      OR: { expiresAt: null | { lt: Date } }[];
    }[];
    const metaWindow = windows.find((w) => w.provider.in.includes("metaAds"))!;
    const googleWindow = windows.find((w) => w.provider.in.includes("gmail"))!;

    expect(metaWindow.OR).toContainEqual({ expiresAt: null });
    expect(metaWindow.OR).toContainEqual({
      expiresAt: { lt: new Date("2026-06-23T12:00:00.000Z") },
    });
    expect(googleWindow.OR).toContainEqual({
      expiresAt: { lt: new Date("2026-06-22T12:05:00.000Z") },
    });
  });
});

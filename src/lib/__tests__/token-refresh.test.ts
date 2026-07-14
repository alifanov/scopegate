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
});

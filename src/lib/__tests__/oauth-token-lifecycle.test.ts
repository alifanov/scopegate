import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db — exchange refresh updates serviceConnection on success.
// $transaction is backed by a FIFO promise chain so tests can exercise the
// same serialization semantics as the real pg_advisory_xact_lock: the second
// concurrent call only runs its callback after the first one settles.
vi.mock("@/lib/db", () => {
  const db = {
    serviceConnection: {
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    teamMember: { findMany: vi.fn() },
    notification: { createMany: vi.fn() },
    $executeRaw: vi.fn(),
    __lockQueue: Promise.resolve() as Promise<unknown>,
    $transaction: undefined as unknown as (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>,
  };
  db.$transaction = vi.fn((fn: (tx: unknown) => Promise<unknown>) => {
    const run = db.__lockQueue.then(() => fn(db));
    db.__lockQueue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  });
  return { db };
});

// Mock crypto — identity transforms so we can assert on plain values
vi.mock("@/lib/crypto", () => ({
  encrypt: (v: string) => `enc(${v})`,
  decrypt: (v: string) => v.replace(/^enc\(|\)$/g, ""),
}));

const mockSpan = {
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
};

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getTracer: () => ({
      startActiveSpan: (_name: string, _options: unknown, callback: (span: typeof mockSpan) => unknown) =>
        callback(mockSpan),
    }),
  },
  SpanKind: { CLIENT: 2 },
  SpanStatusCode: { ERROR: 2 },
}));

import {
  refreshForCron,
  getValidAccessTokenForConnection,
  revokeConnectionWithNotification,
  recordTransientTokenFailure,
  notifyConnectionRevoked,
  classifyOAuthError,
  CONSECUTIVE_FAILURES_THRESHOLD,
  OAuthTokenError,
} from "../oauth-token-lifecycle";
import { db } from "@/lib/db";

const META_ENV = {
  META_APP_ID: "app-id",
  META_APP_SECRET: "app-secret",
};

const baseConn = {
  id: "conn-1",
  provider: "metaAds",
  accountEmail: "u@example.com",
  accessToken: "enc(short-lived-token)",
  refreshToken: null,
  status: "active",
  // expired → forces a refresh attempt
  expiresAt: new Date(Date.now() - 1000),
  consecutiveFailures: 0,
};

describe("metaAds token exchange", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(db.serviceConnection.update).mockReset();
    vi.mocked(db.serviceConnection.updateMany).mockReset();
    vi.mocked(db.serviceConnection.findUnique).mockReset();
    vi.mocked(db.serviceConnection.findUniqueOrThrow).mockReset();
    vi.mocked(db.serviceConnection.findUniqueOrThrow).mockResolvedValue(baseConn as never);
    vi.mocked(db.teamMember.findMany).mockReset();
    vi.mocked(db.notification.createMany).mockReset();
    (db as unknown as { __lockQueue: Promise<unknown> }).__lockQueue = Promise.resolve();
    mockSpan.setAttribute.mockClear();
    mockSpan.setStatus.mockClear();
    mockSpan.recordException.mockClear();
    mockSpan.end.mockClear();
    Object.assign(process.env, META_ENV);
  });

  it("refreshForCron throws OAuthTokenError with Meta code when exchange fails (drives the circuit breaker)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: { code: 190, message: "Error validating access token: expired" },
        }),
      }))
    );

    await expect(refreshForCron(baseConn)).rejects.toBeInstanceOf(OAuthTokenError);
    await expect(refreshForCron(baseConn)).rejects.toThrow(/code=190/);
    // must NOT silently persist anything on failure
    expect(db.serviceConnection.update).not.toHaveBeenCalled();
    expect(mockSpan.setAttribute).toHaveBeenCalledWith("http.status_code", 400);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith("error.code", 190);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith("error.type", "190");
  });

  it("getValidAccessTokenForConnection falls back to the current token on exchange failure (on-demand resilience), but records the transient failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: { code: 190, message: "expired" } }),
      }))
    );
    vi.mocked(db.serviceConnection.update).mockResolvedValue({
      consecutiveFailures: 1,
    } as never);

    const token = await getValidAccessTokenForConnection(baseConn as never);
    expect(token).toBe("short-lived-token");
    // Same circuit breaker the refresh path drives via handler.ts — exchange
    // failures must bump the failure streak too, not just fall back silently.
    expect(db.serviceConnection.update).toHaveBeenCalledWith({
      where: { id: "conn-1" },
      data: {
        status: "error",
        lastError: expect.stringContaining("code=190"),
        consecutiveFailures: { increment: 1 },
      },
      select: { consecutiveFailures: true },
    });
  });

  it("getValidAccessTokenForConnection throws and revokes once repeated exchange failures hit the threshold", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: { code: 190, message: "expired" } }),
      }))
    );
    vi.mocked(db.serviceConnection.update).mockResolvedValue({
      consecutiveFailures: CONSECUTIVE_FAILURES_THRESHOLD,
    } as never);
    vi.mocked(db.serviceConnection.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(db.serviceConnection.findUnique).mockResolvedValue({
      id: "conn-1",
      status: "error",
      provider: "metaAds",
      accountEmail: "u@example.com",
      projectId: "proj-1",
    } as never);
    vi.mocked(db.teamMember.findMany).mockResolvedValue([]);

    await expect(getValidAccessTokenForConnection(baseConn as never)).rejects.toBeInstanceOf(
      OAuthTokenError
    );
    expect(db.serviceConnection.updateMany).toHaveBeenCalledWith({
      where: { id: "conn-1", status: { not: "revoked" } },
      data: { status: "revoked", lastError: expect.stringContaining("code=190") },
    });
  });

  it("refreshForCron persists the new token on a successful exchange", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "long-lived-token", expires_in: 5_184_000 }),
      }))
    );

    const outcome = await refreshForCron(baseConn);
    expect(outcome).toBe("refreshed");
    expect(db.serviceConnection.update).toHaveBeenCalledOnce();
    const arg = vi.mocked(db.serviceConnection.update).mock.calls[0][0];
    expect(arg.data.accessToken).toBe("enc(long-lived-token)");
    expect(arg.data.consecutiveFailures).toBe(0);
  });

  it("concurrent getValidAccessTokenForConnection calls coalesce onto a single network refresh", async () => {
    // Models a one-time-rotation provider: a second real network refresh with
    // the already-consumed token would fail. The lock must ensure only the
    // winner ever calls fetch — the loser re-reads the row it refreshed.
    const mockDb = db as never as {
      serviceConnection: {
        findUniqueOrThrow: { mockImplementation: (fn: () => Promise<unknown>) => void };
        update: { mockImplementation: (fn: (args: { data: Record<string, unknown> }) => Promise<unknown>) => void };
      };
    };
    const connState = { ...baseConn };
    mockDb.serviceConnection.findUniqueOrThrow.mockImplementation(async () => ({ ...connState }));
    mockDb.serviceConnection.update.mockImplementation(async ({ data }) => {
      Object.assign(connState, data);
      return connState;
    });

    let fetchCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        fetchCalls++;
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: "rotated-token", expires_in: 5_184_000 }),
        };
      })
    );

    const [a, b] = await Promise.all([
      getValidAccessTokenForConnection(baseConn as never),
      getValidAccessTokenForConnection(baseConn as never),
    ]);

    expect(fetchCalls).toBe(1);
    expect(db.serviceConnection.update).toHaveBeenCalledOnce();
    expect(a).toBe("rotated-token");
    expect(b).toBe("rotated-token");
  });

  it("revokeConnectionWithNotification sends the reconnect notification exactly once for concurrent revokes", async () => {
    const mockDb = db as never as {
      serviceConnection: {
        updateMany: {
          mockImplementation: (
            fn: (args: { data: { status: string; lastError: string } }) => Promise<{ count: number }>
          ) => void;
        };
        findUnique: { mockImplementation: (fn: () => Promise<unknown>) => void };
      };
      teamMember: { findMany: { mockResolvedValue: (v: unknown) => void } };
      notification: { createMany: { mockResolvedValue: (v: unknown) => void } };
    };
    const connState = {
      id: "conn-1",
      status: "active",
      provider: "metaAds",
      accountEmail: "u@example.com",
      projectId: "proj-1",
    };
    mockDb.serviceConnection.updateMany.mockImplementation(async ({ data }) => {
      if (connState.status === "revoked") return { count: 0 };
      connState.status = data.status;
      return { count: 1 };
    });
    mockDb.serviceConnection.findUnique.mockImplementation(async () => ({ ...connState }));
    mockDb.teamMember.findMany.mockResolvedValue([{ userId: "user-1" }]);
    mockDb.notification.createMany.mockResolvedValue({ count: 1 });

    await Promise.all([
      revokeConnectionWithNotification("conn-1", "invalid_grant A"),
      revokeConnectionWithNotification("conn-1", "invalid_grant B"),
    ]);

    expect(db.notification.createMany).toHaveBeenCalledOnce();
  });

  it("notifyConnectionRevoked fans out one notification per team member per project, deduped by projectId", async () => {
    vi.mocked(db.teamMember.findMany).mockResolvedValue([
      { userId: "user-1", projectId: "proj-1" },
      { userId: "user-2", projectId: "proj-1" },
      { userId: "user-3", projectId: "proj-2" },
    ] as never);
    vi.mocked(db.notification.createMany).mockResolvedValue({ count: 3 } as never);

    await notifyConnectionRevoked([
      { provider: "metaAds", accountEmail: "a@example.com", projectId: "proj-1" },
      { provider: "google", accountEmail: "b@example.com", projectId: "proj-2" },
    ]);

    expect(db.teamMember.findMany).toHaveBeenCalledWith({
      where: { projectId: { in: ["proj-1", "proj-2"] } },
      select: { userId: true, projectId: true },
    });
    expect(db.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ userId: "user-1", title: "Reconnect required" }),
        expect.objectContaining({ userId: "user-2", title: "Reconnect required" }),
        expect.objectContaining({ userId: "user-3", title: "Reconnect required" }),
      ],
    });
  });

  it("notifyConnectionRevoked skips the DB write for an empty connection list", async () => {
    await notifyConnectionRevoked([]);

    expect(db.teamMember.findMany).not.toHaveBeenCalled();
    expect(db.notification.createMany).not.toHaveBeenCalled();
  });
});

describe("classifyOAuthError", () => {
  it("treats a provider registry code (Meta 190) as permanent", () => {
    const err = new OAuthTokenError("Meta token expired or revoked (code 190)", {
      provider: "metaAds",
      code: 190,
    });
    expect(classifyOAuthError(err)).toBe("permanent");
  });

  it("treats a provider registry code (Twitter 401) as permanent", () => {
    const err = new OAuthTokenError("Twitter API error (401)", {
      provider: "twitter",
      code: 401,
    });
    expect(classifyOAuthError(err)).toBe("permanent");
  });

  it("treats a code not in the provider's registry list as transient", () => {
    // 4 is not a known dead-token code for Meta — should not be hard-revoked.
    const err = new OAuthTokenError("Meta Ads API error (500)", {
      provider: "metaAds",
      code: 4,
    });
    expect(classifyOAuthError(err)).toBe("transient");
  });

  it("treats a generic OAuth2 permanent error string as permanent regardless of provider", () => {
    const err = new OAuthTokenError("HubSpot token refresh failed: invalid_grant");
    expect(classifyOAuthError(err)).toBe("permanent");
  });

  it("treats an explicit permanent flag as permanent (revoked-connection / no-refresh-token cases)", () => {
    const err = new OAuthTokenError("Connection conn-1 (github) is revoked — reconnect required", {
      permanent: true,
    });
    expect(classifyOAuthError(err)).toBe("permanent");
  });

  it("treats a bare network failure as transient", () => {
    expect(classifyOAuthError(new Error("network timeout"))).toBe("transient");
  });

  it("treats a non-token error as transient by default (caller decides whether to classify at all)", () => {
    expect(classifyOAuthError(new Error("rate limited"))).toBe("transient");
  });
});

describe("recordTransientTokenFailure", () => {
  beforeEach(() => {
    vi.mocked(db.serviceConnection.update).mockReset();
    vi.mocked(db.serviceConnection.updateMany).mockReset();
    vi.mocked(db.serviceConnection.findUnique).mockReset();
  });

  it("marks the connection as error without revoking below the threshold", async () => {
    vi.mocked(db.serviceConnection.update).mockResolvedValue({
      consecutiveFailures: CONSECUTIVE_FAILURES_THRESHOLD - 1,
    } as never);

    const outcome = await recordTransientTokenFailure("conn-1", "temporary glitch");

    expect(outcome).toBe("error");
    expect(db.serviceConnection.update).toHaveBeenCalledWith({
      where: { id: "conn-1" },
      data: {
        status: "error",
        lastError: "temporary glitch",
        consecutiveFailures: { increment: 1 },
      },
      select: { consecutiveFailures: true },
    });
    expect(db.serviceConnection.updateMany).not.toHaveBeenCalled();
  });

  it("escalates to a full revoke once the threshold is reached", async () => {
    vi.mocked(db.serviceConnection.update).mockResolvedValue({
      consecutiveFailures: CONSECUTIVE_FAILURES_THRESHOLD,
    } as never);
    vi.mocked(db.serviceConnection.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(db.serviceConnection.findUnique).mockResolvedValue({
      id: "conn-1",
      status: "error",
      provider: "twitter",
      accountEmail: "u@example.com",
      projectId: "proj-1",
    } as never);
    vi.mocked(db.teamMember.findMany).mockResolvedValue([]);

    const outcome = await recordTransientTokenFailure("conn-1", "still failing");

    expect(outcome).toBe("revoked");
    expect(db.serviceConnection.updateMany).toHaveBeenCalledWith({
      where: { id: "conn-1", status: { not: "revoked" } },
      data: { status: "revoked", lastError: "still failing" },
    });
  });
});

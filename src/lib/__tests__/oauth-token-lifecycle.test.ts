import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db — exchange refresh updates serviceConnection on success
vi.mock("@/lib/db", () => ({
  db: {
    serviceConnection: {
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

// Mock crypto — identity transforms so we can assert on plain values
vi.mock("@/lib/crypto", () => ({
  encrypt: (v: string) => `enc(${v})`,
  decrypt: (v: string) => v.replace(/^enc\(|\)$/g, ""),
}));

import { refreshForCron, getValidAccessTokenForConnection, OAuthTokenError } from "../oauth-token-lifecycle";
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
  // expired → forces a refresh attempt
  expiresAt: new Date(Date.now() - 1000),
  consecutiveFailures: 0,
};

describe("metaAds token exchange", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(db.serviceConnection.update).mockReset();
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
  });

  it("getValidAccessTokenForConnection falls back to the current token on exchange failure (on-demand resilience)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: { code: 190, message: "expired" } }),
      }))
    );

    const token = await getValidAccessTokenForConnection(baseConn as never);
    expect(token).toBe("short-lived-token");
    expect(db.serviceConnection.update).not.toHaveBeenCalled();
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
});

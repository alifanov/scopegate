import { describe, it, expect, vi, afterEach } from "vitest";
import {
  resolveOAuthApp,
  getOAuthRedirectUri,
  OAuthAppNotConfiguredError,
} from "../oauth-credentials";
import {
  getCredentialGroup,
  providerRequiresOwnApp,
  getConnectTarget,
  PROVIDER_REGISTRY,
} from "../provider-registry";

function fakeDb(row: { clientId: string; clientSecret: string } | null) {
  return {
    providerCredential: { findUnique: vi.fn().mockResolvedValue(row) },
  };
}

const noRows = () => fakeDb(null);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getCredentialGroup", () => {
  // One Google OAuth app backs seven providers — the user must paste it once,
  // not seven times.
  it("puts every Google service in one group", () => {
    for (const key of [
      "gmail",
      "calendar",
      "drive",
      "googleAds",
      "searchConsole",
      "youtube",
      "googleTagManager",
    ]) {
      expect(getCredentialGroup(key)).toBe("google");
    }
  });

  it("keeps the Meta family in separate groups — they are separate apps", () => {
    expect(getCredentialGroup("metaAds")).toBe("meta");
    expect(getCredentialGroup("instagram")).toBe("instagram");
    expect(getCredentialGroup("threads")).toBe("threads");
  });

  it("groups Twitter and Twitter Ads together — one app, one PKCE flow", () => {
    expect(getCredentialGroup("twitter")).toBe("twitter");
    expect(getCredentialGroup("twitterAds")).toBe("twitter");
  });

  it("returns null for API-key and email providers", () => {
    expect(getCredentialGroup("stripe")).toBeNull();
    expect(getCredentialGroup("email")).toBeNull();
  });

  it("gives every OAuth provider a group", () => {
    for (const def of PROVIDER_REGISTRY) {
      if (def.connect.method === "oauth") {
        expect(getCredentialGroup(def.key), def.key).toBeTruthy();
      }
    }
  });
});

describe("providerRequiresOwnApp", () => {
  it("covers every OAuth provider, not just the ones behind a verification wall", () => {
    for (const key of [
      "gmail", "youtube", "metaAds", "instagram", "threads", "linkedin", "twitter",
      "github", "slack", "notion", "hubspot", "jira", "salesforce",
    ]) {
      expect(providerRequiresOwnApp(key), key).toBe(true);
    }
  });

  it("exempts providers that have no OAuth app at all", () => {
    for (const key of ["ahrefs", "semrush", "openrouter"]) {
      expect(providerRequiresOwnApp(key), key).toBe(false);
    }
  });
});

describe("resolveOAuthApp", () => {
  it("prefers the project's own app and decrypts its secret", async () => {
    const database = fakeDb({ clientId: "own-id", clientSecret: "enc(own-secret)" });
    await expect(
      resolveOAuthApp("gmail", "project-1", {
        database: database as never,
        decrypt: (v) => v.replace(/^enc\((.*)\)$/, "$1"),
        cloud: true,
      }),
    ).resolves.toEqual({ clientId: "own-id", clientSecret: "own-secret" });

    expect(database.providerCredential.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId_appGroup: { projectId: "project-1", appGroup: "google" } },
      }),
    );
  });

  // This is today's behaviour and must not change: a self-hosted operator sets
  // GOOGLE_CLIENT_ID and everything keeps working with no UI step at all.
  it("falls back to env vars in self-hosted mode", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "env-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "env-secret");
    await expect(
      resolveOAuthApp("gmail", "project-1", { database: noRows() as never, cloud: false }),
    ).resolves.toEqual({ clientId: "env-id", clientSecret: "env-secret" });
  });

  // The whole point of BYO: on the cloud we must not quietly serve the
  // operator's unverified app, which would fail at Google's consent screen.
  it("refuses to fall back to the operator's app on the cloud", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "env-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "env-secret");
    const error = await resolveOAuthApp("gmail", "project-1", {
      database: noRows() as never,
      cloud: true,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(OAuthAppNotConfiguredError);
    expect(error.appGroup).toBe("google");
    expect(error.status).toBe(428);
  });

  // The operator's app is never lent out on the cloud, even when its env vars
  // are present and the provider needs no verification to launch.
  it("ignores the operator's env on the cloud and demands the user's own app", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "gh-id");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "gh-secret");
    const error = await resolveOAuthApp("github", "project-1", {
      database: noRows() as never,
      cloud: true,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(OAuthAppNotConfiguredError);
    expect(error.appGroup).toBe("github");
    expect(error.status).toBe(428);
  });

  it("still uses the operator's app when self-hosted", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "gh-id");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "gh-secret");
    await expect(
      resolveOAuthApp("github", "project-1", { database: noRows() as never, cloud: false }),
    ).resolves.toEqual({ clientId: "gh-id", clientSecret: "gh-secret" });
  });

  it("derives _APP_SECRET from _APP_ID for the Meta-style providers", async () => {
    vi.stubEnv("THREADS_APP_ID", "th-id");
    vi.stubEnv("THREADS_APP_SECRET", "th-secret");
    await expect(
      resolveOAuthApp("threads", "project-1", { database: noRows() as never, cloud: false }),
    ).resolves.toEqual({ clientId: "th-id", clientSecret: "th-secret" });
  });

  // Previously a missing env var silently interpolated `undefined` into the
  // token request; now it fails with the variable's name.
  it("names the missing env vars instead of sending undefined", async () => {
    vi.stubEnv("SLACK_CLIENT_ID", "");
    vi.stubEnv("SLACK_CLIENT_SECRET", "");
    await expect(
      resolveOAuthApp("slack", "project-1", { database: noRows() as never, cloud: false }),
    ).rejects.toThrow(/SLACK_CLIENT_ID and SLACK_CLIENT_SECRET/);
  });
});

describe("getConnectTarget with BYO", () => {
  it("is unchanged for two-argument callers", () => {
    expect(getConnectTarget("gmail", "project-1")).toEqual({
      kind: "redirect",
      url: "/api/oauth/google?projectId=project-1&provider=gmail",
    });
  });

  it("asks for credentials first on the cloud when none are stored", () => {
    expect(getConnectTarget("gmail", "project-1", { cloud: true, hasOwnApp: false })).toEqual({
      kind: "dialog",
      dialog: "oauthApp",
    });
  });

  it("redirects straight to consent once credentials exist", () => {
    expect(getConnectTarget("gmail", "project-1", { cloud: true, hasOwnApp: true })).toEqual({
      kind: "redirect",
      url: "/api/oauth/google?projectId=project-1&provider=gmail",
    });
  });

  it("asks for credentials for every OAuth provider on the cloud", () => {
    expect(getConnectTarget("github", "project-1", { cloud: true, hasOwnApp: false }).kind).toBe(
      "dialog",
    );
  });

  it("leaves self-hosted going straight to consent", () => {
    expect(getConnectTarget("github", "project-1", { cloud: false, hasOwnApp: false }).kind).toBe(
      "redirect",
    );
  });
});

describe("getOAuthRedirectUri", () => {
  it("matches the URI the callback route actually serves", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://cloud.scopegate.dev");
    expect(getOAuthRedirectUri("google")).toBe(
      "https://cloud.scopegate.dev/api/oauth/google/callback",
    );
  });
});

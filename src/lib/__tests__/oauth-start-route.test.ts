import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    teamMember: { findUnique: vi.fn() },
    providerCredential: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth-middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-middleware")>();
  return {
    ...actual,
    requireCurrentUser: vi.fn(),
  };
});

import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-middleware";
import { PROJECT_ROLE } from "@/lib/project-roles";
import { createOAuthStartRoute } from "@/lib/oauth-start-route";
import { encrypt } from "@/lib/crypto";

const mockTeamMember = vi.mocked(db.teamMember.findUnique);
const mockProviderCredential = vi.mocked(db.providerCredential.findUnique);
const mockRequireCurrentUser = vi.mocked(requireCurrentUser);

const OWNER = { userId: "owner-1", email: "owner@scopegate.dev" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.BETTER_AUTH_SECRET = "test-secret";
  process.env.BETTER_AUTH_URL = "https://scopegate.test";
  delete process.env.SCOPEGATE_CLOUD;
  mockRequireCurrentUser.mockResolvedValue(OWNER);
  mockTeamMember.mockResolvedValue({ role: PROJECT_ROLE.owner } as never);
});

afterEach(() => {
  delete process.env.SCOPEGATE_CLOUD;
});

describe("createOAuthStartRoute — BYO credentials", () => {
  it("redirects using the project's own client_id when a ProviderCredential is registered", async () => {
    mockProviderCredential.mockResolvedValue({
      clientId: "project-owned-client-id",
      clientSecret: encrypt("project-owned-client-secret"),
    } as never);
    process.env.GITHUB_CLIENT_ID = "operator-client-id";

    const GET = createOAuthStartRoute("github");
    const res = await GET(
      new Request("https://scopegate.test/api/oauth/github?projectId=p1"),
    );

    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(new URL(location).searchParams.get("client_id")).toBe("project-owned-client-id");
    expect(location).not.toContain("operator-client-id");
  });

  it("uses the registry key (metaAds), not the route key (meta), to look up the credential", async () => {
    mockProviderCredential.mockResolvedValue(null);
    process.env.META_APP_ID = "operator-meta-app";
    process.env.META_APP_SECRET = "operator-meta-secret";

    const GET = createOAuthStartRoute("meta");
    await GET(new Request("https://scopegate.test/api/oauth/meta?projectId=p1"));

    expect(mockProviderCredential).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId_appGroup: { projectId: "p1", appGroup: "meta" } },
      }),
    );
  });

  it("cloud mode without a registered app returns 428 instead of redirecting to the operator's consent screen", async () => {
    process.env.SCOPEGATE_CLOUD = "1";
    mockProviderCredential.mockResolvedValue(null);

    const GET = createOAuthStartRoute("github");
    const res = await GET(
      new Request("https://scopegate.test/api/oauth/github?projectId=p1"),
    );

    expect(res.status).toBe(428);
  });

  it("self-hosted without a registered app falls back to the operator's env credentials", async () => {
    mockProviderCredential.mockResolvedValue(null);
    process.env.GITHUB_CLIENT_ID = "operator-client-id";
    process.env.GITHUB_CLIENT_SECRET = "operator-client-secret";

    const GET = createOAuthStartRoute("github");
    const res = await GET(
      new Request("https://scopegate.test/api/oauth/github?projectId=p1"),
    );

    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(new URL(location).searchParams.get("client_id")).toBe("operator-client-id");
  });
});

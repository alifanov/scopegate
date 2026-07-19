import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    teamMember: { findUnique: vi.fn() },
    serviceConnection: { upsert: vi.fn() },
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
import { buildSignedState } from "@/lib/oauth-state";
import { handleOAuthCallback, handleOAuthStart } from "@/lib/oauth-flow";

const mockFindUnique = vi.mocked(db.teamMember.findUnique);
const mockUpsert = vi.mocked(db.serviceConnection.upsert);
const mockRequireCurrentUser = vi.mocked(requireCurrentUser);

const OWNER = { userId: "owner-1", email: "owner@scopegate.dev" };
const MEMBER = { userId: "member-1", email: "member@scopegate.dev" };

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ADMIN_EMAIL;
  process.env.BETTER_AUTH_SECRET = "test-secret";
  process.env.BETTER_AUTH_URL = "https://scopegate.test";
});

describe("handleOAuthStart", () => {
  it("denies a plain member (not owner)", async () => {
    mockRequireCurrentUser.mockResolvedValue(MEMBER);
    mockFindUnique.mockResolvedValue({ role: PROJECT_ROLE.member } as never);

    const res = await handleOAuthStart(
      new Request("https://scopegate.test/api/oauth/github?projectId=p1"),
      { buildUrl: () => "https://github.com/authorize" },
    );

    expect(res.status).toBe(403);
  });

  it("allows a project owner", async () => {
    mockRequireCurrentUser.mockResolvedValue(OWNER);
    mockFindUnique.mockResolvedValue({ role: PROJECT_ROLE.owner } as never);

    const res = await handleOAuthStart(
      new Request("https://scopegate.test/api/oauth/github?projectId=p1"),
      { buildUrl: () => "https://github.com/authorize" },
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://github.com/authorize");
  });
});

describe("handleOAuthCallback", () => {
  function makeRequest(projectId: string, csrfToken: string) {
    const state = buildSignedState({ projectId, provider: "github", csrfToken });
    return new Request(
      `https://scopegate.test/api/oauth/github/callback?code=abc&state=${encodeURIComponent(state)}`,
      { headers: { cookie: `oauth_csrf=${csrfToken}` } },
    );
  }

  it("denies a plain member and redirects with error", async () => {
    mockRequireCurrentUser.mockResolvedValue(MEMBER);
    mockFindUnique.mockResolvedValue({ role: PROJECT_ROLE.member } as never);

    const res = await handleOAuthCallback(makeRequest("p1", "csrf-1"), {
      expectedProvider: "github",
      exchange: vi.fn(),
      getConnectionData: vi.fn(),
    });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://scopegate.test/projects/p1?tab=services&error=oauth_failed",
    );
  });

  it("allows a project owner through to persistence", async () => {
    mockRequireCurrentUser.mockResolvedValue(OWNER);
    mockFindUnique.mockResolvedValue({ role: PROJECT_ROLE.owner } as never);
    mockUpsert.mockResolvedValue({ id: "conn-1" } as never);

    const res = await handleOAuthCallback(makeRequest("p1", "csrf-2"), {
      expectedProvider: "github",
      exchange: vi.fn().mockResolvedValue({ access_token: "tok" }),
      getConnectionData: vi.fn().mockResolvedValue({ accountEmail: "u@example.com" }),
    });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://scopegate.test/projects/p1?tab=services",
    );
    expect(mockUpsert).toHaveBeenCalled();
  });
});

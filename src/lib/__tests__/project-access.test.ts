import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    teamMember: { findUnique: vi.fn() },
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
import { requireCurrentUser, ForbiddenError, NotFoundError } from "@/lib/auth-middleware";
import { authorizeProject, withProjectAuth } from "@/lib/project-access";
import { PROJECT_ROLE } from "@/lib/project-roles";

const mockFindUnique = vi.mocked(db.teamMember.findUnique);
const mockRequireCurrentUser = vi.mocked(requireCurrentUser);

const OWNER = { userId: "owner-1", email: "owner@scopegate.dev" };
const MEMBER = { userId: "member-1", email: "member@scopegate.dev" };
const OUTSIDER = { userId: "outsider-1", email: "outsider@scopegate.dev" };
const ADMIN = { userId: "admin-1", email: "admin@scopegate.dev" };

describe("authorizeProject — role matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = ADMIN.email;
  });

  it("member requesting member access is allowed", async () => {
    mockFindUnique.mockResolvedValue({ role: PROJECT_ROLE.member } as never);
    await expect(authorizeProject(MEMBER, "p1", "member")).resolves.toEqual({
      role: PROJECT_ROLE.member,
    });
  });

  it("member requesting owner access is forbidden", async () => {
    mockFindUnique.mockResolvedValue({ role: PROJECT_ROLE.member } as never);
    await expect(authorizeProject(MEMBER, "p1", "owner")).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it("owner requesting owner access is allowed", async () => {
    mockFindUnique.mockResolvedValue({ role: PROJECT_ROLE.owner } as never);
    await expect(authorizeProject(OWNER, "p1", "owner")).resolves.toEqual({
      role: PROJECT_ROLE.owner,
    });
  });

  it("non-member non-admin gets NotFound regardless of role", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(authorizeProject(OUTSIDER, "p1", "member")).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(authorizeProject(OUTSIDER, "p1", "owner")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("admin without a membership row overrides both member and owner checks", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(authorizeProject(ADMIN, "p1", "member")).resolves.toBeNull();
    await expect(authorizeProject(ADMIN, "p1", "owner")).resolves.toBeNull();
  });

  it("admin with only a member row is still allowed owner access", async () => {
    mockFindUnique.mockResolvedValue({ role: PROJECT_ROLE.member } as never);
    await expect(authorizeProject(ADMIN, "p1", "owner")).resolves.toEqual({
      role: PROJECT_ROLE.member,
    });
  });
});

describe("withProjectAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAIL;
  });

  function makeCtx(projectId: string) {
    return { params: Promise.resolve({ projectId }) };
  }

  it("maps auth failures to the right HTTP status without calling the handler", async () => {
    mockRequireCurrentUser.mockResolvedValue(MEMBER);
    mockFindUnique.mockResolvedValue(null);
    const handler = vi.fn();

    const route = withProjectAuth("member", handler);
    const res = await route(new Request("http://localhost"), makeCtx("p1"));

    expect(res.status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the handler with resolved user/member/params on success", async () => {
    mockRequireCurrentUser.mockResolvedValue(OWNER);
    mockFindUnique.mockResolvedValue({ role: PROJECT_ROLE.owner } as never);
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const route = withProjectAuth("owner", handler);
    await route(new Request("http://localhost"), makeCtx("p1"));

    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        user: OWNER,
        member: { role: PROJECT_ROLE.owner },
        params: { projectId: "p1" },
      })
    );
  });
});

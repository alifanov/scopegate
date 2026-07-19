import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/admin", () => ({
  isAdmin: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { withAdminAuth, withUserAuth } from "@/lib/auth-middleware";

const mockGetSession = vi.mocked(auth.api.getSession);
const mockIsAdmin = vi.mocked(isAdmin);

const USER = { id: "user-1", email: "user@scopegate.dev" };
const ADMIN = { id: "admin-1", email: "admin@scopegate.dev" };

describe("withAdminAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 and never calls the handler when there is no session", async () => {
    mockGetSession.mockResolvedValue(null as never);
    const handler = vi.fn();

    const res = await withAdminAuth(handler)(new Request("http://localhost"));

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 403 and never calls the handler for a non-admin user", async () => {
    mockGetSession.mockResolvedValue({ user: USER } as never);
    mockIsAdmin.mockReturnValue(false);
    const handler = vi.fn();

    const res = await withAdminAuth(handler)(new Request("http://localhost"));

    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the handler with the resolved admin user on success", async () => {
    mockGetSession.mockResolvedValue({ user: ADMIN } as never);
    mockIsAdmin.mockReturnValue(true);
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const res = await withAdminAuth(handler)(new Request("http://localhost"));

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      { userId: ADMIN.id, email: ADMIN.email }
    );
  });
});

describe("withUserAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 and never calls the handler when there is no session", async () => {
    mockGetSession.mockResolvedValue(null as never);
    const handler = vi.fn();

    const res = await withUserAuth(handler)(new Request("http://localhost"));

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the handler with the resolved user on success", async () => {
    mockGetSession.mockResolvedValue({ user: USER } as never);
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const res = await withUserAuth(handler)(new Request("http://localhost"));

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      { userId: USER.id, email: USER.email }
    );
  });
});

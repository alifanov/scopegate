import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    teamMember: { findUnique: vi.fn() },
    mcpEndpoint: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    endpointPermission: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

// Mock auth middleware
vi.mock("@/lib/auth-middleware", () => ({
  getCurrentUser: vi.fn(),
}));

import { PATCH, DELETE } from "../route";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";

const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockTeamMemberFindUnique = vi.mocked(db.teamMember.findUnique);
const mockEndpointFindFirst = vi.mocked(db.mcpEndpoint.findFirst);
const mockEndpointFindUnique = vi.mocked(db.mcpEndpoint.findUnique);
const mockEndpointUpdate = vi.mocked(db.mcpEndpoint.update);
const mockEndpointDelete = vi.mocked(db.mcpEndpoint.delete);
const mockPermissionDeleteMany = vi.mocked(db.endpointPermission.deleteMany);
const mockPermissionCreateMany = vi.mocked(db.endpointPermission.createMany);

function makeParams(projectId: string, endpointId: string) {
  return { params: Promise.resolve({ projectId, endpointId }) };
}

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/projects/p1/endpoints/e1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("endpoint route – IDOR (Fix 1) + permission validation (Fix 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ userId: "user-1", email: "a@b.com" });
    mockTeamMemberFindUnique.mockResolvedValue({ id: "tm-1" } as never);
  });

  // --- IDOR tests ---

  describe("PATCH – IDOR protection", () => {
    it("returns 404 when endpoint does not belong to project", async () => {
      mockEndpointFindFirst.mockResolvedValue(null as never);

      const res = await PATCH(
        makeRequest({ name: "updated" }),
        makeParams("project-A", "endpoint-from-project-B")
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Not found");
    });

    it("succeeds when endpoint belongs to project", async () => {
      mockEndpointFindFirst.mockResolvedValue({ id: "e1", projectId: "p1" } as never);
      mockEndpointUpdate.mockResolvedValue({ id: "e1", name: "updated" } as never);
      mockEndpointFindUnique.mockResolvedValue({
        id: "e1",
        name: "updated",
        permissions: [],
      } as never);

      const res = await PATCH(
        makeRequest({ name: "updated" }),
        makeParams("p1", "e1")
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.endpoint.name).toBe("updated");
    });
  });

  describe("DELETE – IDOR protection", () => {
    it("returns 404 when endpoint does not belong to project", async () => {
      mockEndpointFindFirst.mockResolvedValue(null as never);

      const res = await DELETE(
        new Request("http://localhost"),
        makeParams("project-A", "endpoint-from-project-B")
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Not found");
    });

    it("succeeds when endpoint belongs to project", async () => {
      mockEndpointFindFirst.mockResolvedValue({ id: "e1", projectId: "p1" } as never);
      mockEndpointDelete.mockResolvedValue({ id: "e1" } as never);

      const res = await DELETE(
        new Request("http://localhost"),
        makeParams("p1", "e1")
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  // --- Permission validation tests ---

  describe("PATCH – permission validation", () => {
    it("returns 400 with error for invalid permissions", async () => {
      mockEndpointFindFirst.mockResolvedValue({ id: "e1", projectId: "p1" } as never);
      mockEndpointUpdate.mockResolvedValue({ id: "e1" } as never);

      const res = await PATCH(
        makeRequest({ permissions: ["calendar:list_events", "foo:bar", "evil:action"] }),
        makeParams("p1", "e1")
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Invalid permissions");
      expect(body.error).toContain("foo:bar");
      expect(body.error).toContain("evil:action");
    });

    it("succeeds with valid permissions", async () => {
      mockEndpointFindFirst.mockResolvedValue({ id: "e1", projectId: "p1" } as never);
      mockEndpointUpdate.mockResolvedValue({ id: "e1" } as never);
      mockPermissionDeleteMany.mockResolvedValue({ count: 0 } as never);
      mockPermissionCreateMany.mockResolvedValue({ count: 2 } as never);
      mockEndpointFindUnique.mockResolvedValue({
        id: "e1",
        permissions: [
          { action: "calendar:list_events" },
          { action: "gmail:read_emails" },
        ],
      } as never);

      const res = await PATCH(
        makeRequest({ permissions: ["calendar:list_events", "gmail:read_emails"] }),
        makeParams("p1", "e1")
      );

      expect(res.status).toBe(200);
      expect(mockPermissionDeleteMany).toHaveBeenCalledWith({ where: { endpointId: "e1" } });
      expect(mockPermissionCreateMany).toHaveBeenCalledWith({
        data: [
          { action: "calendar:list_events", endpointId: "e1" },
          { action: "gmail:read_emails", endpointId: "e1" },
        ],
      });
    });
  });
});

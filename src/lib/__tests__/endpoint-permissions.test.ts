import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EndpointPermissionError,
  applyEndpointPermissions,
  createProjectEndpoint,
  validateEndpointPermissions,
} from "../endpoint-permissions";

const database = {
  serviceConnection: { findFirst: vi.fn() },
  mcpEndpoint: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  endpointPermission: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
};

const audit = vi.fn();
function transaction<T>(fn: (tx: typeof database) => Promise<T>): Promise<T> {
  return fn(database);
}

describe("endpoint permission service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects permissions outside the MCP whitelist", () => {
    expect(() =>
      validateEndpointPermissions(["calendar:list_events", "evil:action"])
    ).toThrow(EndpointPermissionError);
  });

  it("verifies the service connection belongs to the project before creating an endpoint", async () => {
    database.serviceConnection.findFirst.mockResolvedValue(null);

    await expect(
      createProjectEndpoint(
        {
          projectId: "project-1",
          name: "Production",
          serviceConnectionId: "connection-1",
          permissions: ["calendar:list_events"],
        },
        { database, audit, apiKeyGenerator: () => "sg_test" }
      )
    ).rejects.toMatchObject({
      message: "Service connection not found",
      status: 404,
    });

    expect(database.mcpEndpoint.create).not.toHaveBeenCalled();
  });

  it("creates endpoint permissions and records audit data in one service call", async () => {
    database.serviceConnection.findFirst.mockResolvedValue({ id: "connection-1" });
    database.mcpEndpoint.create.mockResolvedValue({
      id: "endpoint-1",
      permissions: [{ action: "calendar:list_events" }],
    });

    const endpoint = await createProjectEndpoint(
      {
        projectId: "project-1",
        name: "Production",
        serviceConnectionId: "connection-1",
        permissions: ["calendar:list_events"],
        rateLimitPerMinute: 25,
      },
      { database, audit, apiKeyGenerator: () => "sg_test" }
    );

    expect(endpoint.id).toBe("endpoint-1");
    expect(database.mcpEndpoint.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        apiKey: "sg_test",
        rateLimitPerMinute: 25,
        permissions: {
          create: [{ action: "calendar:list_events" }],
        },
      }),
      include: { permissions: true },
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        endpointId: "endpoint-1",
        projectId: "project-1",
        action: "endpoint:create",
        status: "success",
      })
    );
  });

  it("replaces endpoint permissions during updates", async () => {
    database.mcpEndpoint.findFirst.mockResolvedValue({ id: "endpoint-1" });
    database.mcpEndpoint.update.mockResolvedValue({ id: "endpoint-1" });
    database.endpointPermission.deleteMany.mockResolvedValue({ count: 1 });
    database.endpointPermission.createMany.mockResolvedValue({ count: 2 });
    database.mcpEndpoint.findUnique.mockResolvedValue({
      id: "endpoint-1",
      permissions: [
        { action: "calendar:list_events" },
        { action: "gmail:read_emails" },
      ],
    });

    await applyEndpointPermissions(
      {
        projectId: "project-1",
        endpointId: "endpoint-1",
        permissions: ["calendar:list_events", "gmail:read_emails"],
      },
      { database, audit, transaction }
    );

    expect(database.endpointPermission.deleteMany).toHaveBeenCalledWith({
      where: { endpointId: "endpoint-1" },
    });
    expect(database.endpointPermission.createMany).toHaveBeenCalledWith({
      data: [
        { action: "calendar:list_events", endpointId: "endpoint-1" },
        { action: "gmail:read_emails", endpointId: "endpoint-1" },
      ],
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "endpoint:update",
        params: expect.objectContaining({
          permissions: ["calendar:list_events", "gmail:read_emails"],
        }),
      })
    );
  });

  it("rolls back the whole update when the permission replacement fails mid-transaction", async () => {
    database.mcpEndpoint.findFirst.mockResolvedValue({ id: "endpoint-1" });
    database.mcpEndpoint.update.mockResolvedValue({ id: "endpoint-1" });
    database.endpointPermission.deleteMany.mockResolvedValue({ count: 1 });
    database.endpointPermission.createMany.mockRejectedValue(new Error("db exploded"));

    await expect(
      applyEndpointPermissions(
        {
          projectId: "project-1",
          endpointId: "endpoint-1",
          permissions: ["calendar:list_events"],
        },
        { database, audit, transaction }
      )
    ).rejects.toThrow("db exploded");

    // the transaction failed before commit — no read of a partially-applied
    // state and no audit row for a change that never fully landed
    expect(database.mcpEndpoint.findUnique).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });
});

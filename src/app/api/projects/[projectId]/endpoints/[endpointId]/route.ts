import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import { recordAudit } from "@/lib/audit";
import {
  applyEndpointPermissions,
  EndpointPermissionError,
} from "@/lib/endpoint-permissions";

type Params = { projectId: string; endpointId: string };

// GET /api/projects/[projectId]/endpoints/[endpointId]
export const GET = withProjectAuth<Params>(
  "member",
  async (_request, { params: { projectId, endpointId } }) => {
    const endpoint = await db.mcpEndpoint.findFirst({
      where: { id: endpointId, projectId },
      include: {
        serviceConnection: { select: { provider: true, accountEmail: true } },
        permissions: { select: { id: true, action: true } },
        _count: { select: { auditLogs: true } },
      },
    });

    if (!endpoint) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ endpoint });
  }
);

// PATCH /api/projects/[projectId]/endpoints/[endpointId]
export const PATCH = withProjectAuth<Params>(
  "owner",
  async (request, { params: { projectId, endpointId } }) => {
    try {
      const { name, isActive, rateLimitPerMinute, permissions } =
        await request.json();

      const updated = await applyEndpointPermissions({
        projectId,
        endpointId,
        name,
        isActive,
        rateLimitPerMinute,
        permissions,
      });

      return NextResponse.json({ endpoint: updated });
    } catch (error) {
      if (error instanceof EndpointPermissionError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/projects/[projectId]/endpoints/[endpointId]
export const DELETE = withProjectAuth<Params>(
  "owner",
  async (_request, { params: { projectId, endpointId } }) => {
    const existing = await db.mcpEndpoint.findFirst({
      where: { id: endpointId, projectId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.mcpEndpoint.delete({ where: { id: endpointId } });

    await recordAudit({
      projectId,
      action: "endpoint:delete",
      params: {
        endpointId,
        name: existing.name,
        serviceConnectionId: existing.serviceConnectionId,
      },
      status: "success",
    });

    return NextResponse.json({ success: true });
  }
);

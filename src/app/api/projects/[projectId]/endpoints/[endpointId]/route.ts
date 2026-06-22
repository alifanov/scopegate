import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth-middleware";
import { requireProjectMember, requireProjectOwner } from "@/lib/project-auth";
import { recordAudit } from "@/lib/audit";
import {
  applyEndpointPermissions,
  EndpointPermissionError,
} from "@/lib/endpoint-permissions";

type Params = { params: Promise<{ projectId: string; endpointId: string }> };

// GET /api/projects/[projectId]/endpoints/[endpointId]
export async function GET(_request: Request, { params }: Params) {
  let projectId: string;
  let endpointId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId, endpointId } = await params);
    await requireProjectMember(user.userId, projectId);
  } catch (error) {
    return authErrorResponse(error);
  }

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

// PATCH /api/projects/[projectId]/endpoints/[endpointId]
export async function PATCH(request: Request, { params }: Params) {
  let projectId: string;
  let endpointId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId, endpointId } = await params);
    await requireProjectOwner(user.userId, projectId);
  } catch (error) {
    return authErrorResponse(error);
  }

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

// DELETE /api/projects/[projectId]/endpoints/[endpointId]
export async function DELETE(_request: Request, { params }: Params) {
  let projectId: string;
  let endpointId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId, endpointId } = await params);
    await requireProjectOwner(user.userId, projectId);
  } catch (error) {
    return authErrorResponse(error);
  }

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

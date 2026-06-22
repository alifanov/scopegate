import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth-middleware";
import { requireProjectMember, requireProjectOwner } from "@/lib/project-auth";
import {
  createProjectEndpoint,
  EndpointPermissionError,
} from "@/lib/endpoint-permissions";

// GET /api/projects/[projectId]/endpoints
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  let projectId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId } = await params);
    await requireProjectMember(user.userId, projectId);
  } catch (error) {
    return authErrorResponse(error);
  }

  const endpoints = await db.mcpEndpoint.findMany({
    where: { projectId },
    include: {
      serviceConnection: { select: { provider: true, accountEmail: true } },
      permissions: { select: { action: true } },
      _count: { select: { auditLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ endpoints });
}

// POST /api/projects/[projectId]/endpoints
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  let projectId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId } = await params);
    await requireProjectOwner(user.userId, projectId);
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const { name, serviceConnectionId, permissions, rateLimitPerMinute } =
      await request.json();

    if (!name || !serviceConnectionId) {
      return NextResponse.json(
        { error: "Name and serviceConnectionId are required" },
        { status: 400 }
      );
    }

    const endpoint = await createProjectEndpoint({
      name,
      projectId,
      serviceConnectionId,
      permissions,
      rateLimitPerMinute,
    });

    return NextResponse.json({ endpoint }, { status: 201 });
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

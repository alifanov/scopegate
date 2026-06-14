import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth-middleware";
import { requireProjectMember, requireProjectOwner } from "@/lib/project-auth";
import { generateMcpApiKey } from "@/lib/mcp/api-keys";
import { ALL_ACTIONS } from "@/lib/mcp/permissions";
import { recordAudit } from "@/lib/audit";

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

    // Validate permissions against whitelist
    if (permissions) {
      const invalid = (permissions as string[]).filter(
        (a: string) => !ALL_ACTIONS.includes(a)
      );
      if (invalid.length) {
        return NextResponse.json(
          { error: `Invalid permissions: ${invalid.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Verify service connection belongs to project
    const service = await db.serviceConnection.findFirst({
      where: { id: serviceConnectionId, projectId },
    });
    if (!service) {
      return NextResponse.json(
        { error: "Service connection not found" },
        { status: 404 }
      );
    }

    const endpoint = await db.mcpEndpoint.create({
      data: {
        name,
        apiKey: generateMcpApiKey(),
        projectId,
        serviceConnectionId,
        rateLimitPerMinute: rateLimitPerMinute ?? 60,
        permissions: {
          create: (permissions as string[])?.map((action: string) => ({
            action,
          })) ?? [],
        },
      },
      include: { permissions: true },
    });

    await recordAudit({
      endpointId: endpoint.id,
      projectId,
      action: "endpoint:create",
      params: {
        endpointId: endpoint.id,
        name,
        serviceConnectionId,
        permissions,
        rateLimitPerMinute: rateLimitPerMinute ?? 60,
      },
      status: "success",
    });

    return NextResponse.json({ endpoint }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

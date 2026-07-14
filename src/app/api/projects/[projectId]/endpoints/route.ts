import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import {
  createProjectEndpoint,
  EndpointPermissionError,
} from "@/lib/endpoint-permissions";

// GET /api/projects/[projectId]/endpoints
export const GET = withProjectAuth<{ projectId: string }>(
  "member",
  async (_request, { params: { projectId } }) => {
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
);

// POST /api/projects/[projectId]/endpoints
export const POST = withProjectAuth<{ projectId: string }>(
  "owner",
  async (request, { params: { projectId } }) => {
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
);

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import { createProjectEndpoint } from "@/lib/endpoint-permissions";
import { assertWithinLimit, resolveProjectOwnerId } from "@/lib/plan-limits";

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
    const { name, serviceConnectionId, permissions, rateLimitPerMinute } =
      await request.json();

    if (!name || !serviceConnectionId) {
      return NextResponse.json(
        { error: "Name and serviceConnectionId are required" },
        { status: 400 }
      );
    }

    // Quota belongs to the project owner, not to whoever is calling — a Free
    // teammate inside a Pro user's project must not be blocked by their own plan.
    const ownerId = await resolveProjectOwnerId(projectId);
    if (ownerId) {
      await assertWithinLimit(ownerId, "endpoints");
    }

    const endpoint = await createProjectEndpoint({
      name,
      projectId,
      serviceConnectionId,
      permissions,
      rateLimitPerMinute,
    });

    return NextResponse.json({ endpoint }, { status: 201 });
  }
);

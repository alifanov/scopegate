import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import { recordAudit } from "@/lib/audit";

// GET /api/projects/[projectId]
export const GET = withProjectAuth<{ projectId: string }>(
  "member",
  async (_request, { params: { projectId } }) => {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        teamMembers: { include: { user: { select: { id: true, email: true, name: true } } } },
        serviceConnections: { select: { id: true, provider: true, accountEmail: true, createdAt: true } },
        _count: { select: { mcpEndpoints: true } },
      },
    });

    return NextResponse.json({ project });
  }
);

// PATCH /api/projects/[projectId]
export const PATCH = withProjectAuth<{ projectId: string }>(
  "owner",
  async (request, { params: { projectId } }) => {
    try {
      const { name } = await request.json();
      const project = await db.project.update({
        where: { id: projectId },
        data: { name },
      });

      await recordAudit({
        projectId,
        action: "project:update",
        params: { projectId, name },
        status: "success",
      });

      return NextResponse.json({ project });
    } catch {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/projects/[projectId]
export const DELETE = withProjectAuth<{ projectId: string }>(
  "owner",
  async (_request, { params: { projectId } }) => {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    await db.project.delete({ where: { id: projectId } });

    await recordAudit({
      projectId,
      action: "project:delete",
      params: { projectId, name: project?.name },
      status: "success",
    });

    return NextResponse.json({ success: true });
  }
);

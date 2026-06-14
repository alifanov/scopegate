import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth-middleware";
import { requireProjectMember, requireProjectOwner } from "@/lib/project-auth";
import { recordAudit } from "@/lib/audit";

// GET /api/projects/[projectId]
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

// PATCH /api/projects/[projectId]
export async function PATCH(
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

// DELETE /api/projects/[projectId]
export async function DELETE(
  _request: Request,
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

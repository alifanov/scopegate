import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";

async function verifyMembership(userId: string, projectId: string) {
  return db.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
}

// GET /api/projects/[projectId]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const member = await verifyMembership(user.userId, projectId);
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const member = await verifyMembership(user.userId, projectId);
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name } = await request.json();
    const project = await db.project.update({
      where: { id: projectId },
      data: { name },
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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const member = await verifyMembership(user.userId, projectId);
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.project.delete({ where: { id: projectId } });
  return NextResponse.json({ success: true });
}

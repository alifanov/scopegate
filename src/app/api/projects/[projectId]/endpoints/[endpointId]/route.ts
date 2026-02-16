import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { ALL_ACTIONS } from "@/lib/mcp/permissions";

type Params = { params: Promise<{ projectId: string; endpointId: string }> };

// GET /api/projects/[projectId]/endpoints/[endpointId]
export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, endpointId } = await params;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, endpointId } = await params;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const existing = await db.mcpEndpoint.findFirst({
      where: { id: endpointId, projectId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { name, isActive, rateLimitPerMinute, permissions } =
      await request.json();

    await db.mcpEndpoint.update({
      where: { id: endpointId },
      data: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(rateLimitPerMinute !== undefined && { rateLimitPerMinute }),
      },
    });

    // Update permissions if provided
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

      await db.endpointPermission.deleteMany({ where: { endpointId } });
      await db.endpointPermission.createMany({
        data: (permissions as string[]).map((action) => ({
          action,
          endpointId,
        })),
      });
    }

    const updated = await db.mcpEndpoint.findUnique({
      where: { id: endpointId },
      include: { permissions: true },
    });

    return NextResponse.json({ endpoint: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/endpoints/[endpointId]
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, endpointId } = await params;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await db.mcpEndpoint.findFirst({
    where: { id: endpointId, projectId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.mcpEndpoint.delete({ where: { id: endpointId } });
  return NextResponse.json({ success: true });
}

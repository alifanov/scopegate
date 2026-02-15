import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";

// GET /api/projects/[projectId]/endpoints
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

    return NextResponse.json({ endpoint }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

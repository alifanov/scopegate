import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth-middleware";
import { requireProjectMember } from "@/lib/project-auth";

// GET /api/projects/[projectId]/audit
export async function GET(
  request: Request,
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

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const status = url.searchParams.get("status");
  const endpointId = url.searchParams.get("endpointId");

  const where = {
    OR: [{ projectId }, { endpoint: { projectId } }],
    ...(status && { status }),
    ...(endpointId && { endpointId }),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        endpoint: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

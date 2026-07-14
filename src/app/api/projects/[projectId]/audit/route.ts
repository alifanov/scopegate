import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import { AuditStatus } from "@/generated/prisma/client";

function isAuditStatus(value: string): value is AuditStatus {
  return (Object.values(AuditStatus) as string[]).includes(value);
}

// GET /api/projects/[projectId]/audit
export const GET = withProjectAuth<{ projectId: string }>(
  "member",
  async (request, { params: { projectId } }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
    const status = url.searchParams.get("status");
    const endpointId = url.searchParams.get("endpointId");

    let statusFilter: AuditStatus | undefined;
    if (status) {
      if (!isAuditStatus(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      statusFilter = status;
    }

    const where = {
      projectId,
      ...(statusFilter && { status: statusFilter }),
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
);

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const projects = await db.project.findMany({
    include: {
      teamMembers: {
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

import { NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    return authErrorResponse(error);
  }

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

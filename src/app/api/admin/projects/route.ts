import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export const GET = withAdminAuth(async () => {
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
});

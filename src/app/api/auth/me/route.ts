import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-middleware";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.userId },
    select: { id: true, email: true, name: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    isAdmin: isAdmin(dbUser.email),
  });
}

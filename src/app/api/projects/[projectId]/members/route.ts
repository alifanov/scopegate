import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { isAdmin } from "@/lib/admin";

async function canManageMembers(
  userId: string,
  email: string,
  projectId: string
) {
  if (isAdmin(email)) return true;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return member?.role === "owner";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  if (!(await canManageMembers(user.userId, user.email, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { email } = body ?? {};
  if (!email)
    return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const targetUser = await db.user.findUnique({ where: { email } });
  if (!targetUser)
    return NextResponse.json(
      { error: "User not found. Make sure they have an account." },
      { status: 404 }
    );

  const existing = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: targetUser.id, projectId } },
  });
  if (existing)
    return NextResponse.json(
      { error: "User is already a member of this project" },
      { status: 409 }
    );

  const member = await db.teamMember.create({
    data: { userId: targetUser.id, projectId, role: "member" },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  return NextResponse.json({ member }, { status: 201 });
}

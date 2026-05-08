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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, userId } = await params;

  if (!(await canManageMembers(user.userId, user.email, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const memberToRemove = await db.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!memberToRemove)
    return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (memberToRemove.role === "owner") {
    const ownerCount = await db.teamMember.count({
      where: { projectId, role: "owner" },
    });
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last owner" },
        { status: 400 }
      );
    }
  }

  await db.teamMember.delete({
    where: { userId_projectId: { userId, projectId } },
  });

  return NextResponse.json({ success: true });
}

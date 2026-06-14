import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth-middleware";
import { canManageMembers } from "@/lib/project-auth";
import { PROJECT_ROLE } from "@/lib/project-roles";
import { recordAudit } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  let projectId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId } = await params);
    if (!(await canManageMembers(user.userId, user.email, projectId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (error) {
    return authErrorResponse(error);
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
    data: { userId: targetUser.id, projectId, role: PROJECT_ROLE.member },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  await recordAudit({
    projectId,
    action: "member:add",
    params: { userId: targetUser.id, email },
    status: "success",
  });

  return NextResponse.json({ member }, { status: 201 });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth-middleware";
import { canManageMembers, isProjectOwner } from "@/lib/project-auth";
import { PROJECT_ROLE } from "@/lib/project-roles";
import { recordAudit } from "@/lib/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; userId: string }> }
) {
  let projectId: string;
  let userId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId, userId } = await params);
    if (!(await canManageMembers(user.userId, user.email, projectId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (error) {
    return authErrorResponse(error);
  }

  const memberToRemove = await db.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!memberToRemove)
    return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (isProjectOwner(memberToRemove.role)) {
    const ownerCount = await db.teamMember.count({
      where: { projectId, role: PROJECT_ROLE.owner },
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

  await recordAudit({
    projectId,
    action: "member:remove",
    params: { userId, role: memberToRemove.role },
    status: "success",
  });

  return NextResponse.json({ success: true });
}

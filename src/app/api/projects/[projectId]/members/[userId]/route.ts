import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import { isProjectOwner, PROJECT_ROLE } from "@/lib/project-roles";
import { recordAudit } from "@/lib/audit";

export const DELETE = withProjectAuth<{ projectId: string; userId: string }>(
  "owner",
  async (_request, { params: { projectId, userId } }) => {
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
);

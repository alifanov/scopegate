import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { isProjectOwner, PROJECT_ROLE } from "@/lib/project-roles";

type TeamMembershipDatabase = {
  teamMember: Pick<typeof db.teamMember, "findUnique" | "count" | "delete">;
};

export class TeamMembershipError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TeamMembershipError";
    this.status = status;
  }
}

type RemoveMemberOptions = {
  database?: TeamMembershipDatabase;
  audit?: typeof recordAudit;
};

export async function removeProjectMember(
  projectId: string,
  userId: string,
  { database = db, audit = recordAudit }: RemoveMemberOptions = {}
) {
  const memberToRemove = await database.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!memberToRemove) {
    throw new TeamMembershipError("Member not found", 404);
  }

  if (isProjectOwner(memberToRemove.role)) {
    const ownerCount = await database.teamMember.count({
      where: { projectId, role: PROJECT_ROLE.owner },
    });
    if (ownerCount <= 1) {
      throw new TeamMembershipError("Cannot remove the last owner", 400);
    }
  }

  await database.teamMember.delete({
    where: { userId_projectId: { userId, projectId } },
  });

  await audit({
    projectId,
    action: "member:remove",
    params: { userId, role: memberToRemove.role },
    status: "success",
  });
}

import type { ProjectRole, TeamMember } from "@/generated/prisma/client";
import { db } from "./db";
import { isAdmin } from "./admin";
import { ForbiddenError, NotFoundError } from "./auth-middleware";
import { PROJECT_ROLE, isProjectOwner } from "./project-roles";

export { isProjectOwner } from "./project-roles";

export function isProjectMemberRole(
  role: ProjectRole | null | undefined
): boolean {
  return role === PROJECT_ROLE.member;
}

export async function requireProjectMember(
  userId: string,
  projectId: string
): Promise<TeamMember> {
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!member) {
    throw new NotFoundError();
  }
  return member;
}

export async function requireProjectOwner(
  userId: string,
  projectId: string
): Promise<TeamMember> {
  const member = await requireProjectMember(userId, projectId);
  if (!isProjectOwner(member.role)) {
    throw new ForbiddenError();
  }
  return member;
}

export async function canManageMembers(
  userId: string,
  email: string,
  projectId: string
): Promise<boolean> {
  if (isAdmin(email)) return true;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return isProjectOwner(member?.role);
}

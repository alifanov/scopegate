import type { ProjectRole } from "@/generated/prisma/client";

export const PROJECT_ROLE = {
  member: "member",
  owner: "owner",
} as const satisfies Record<ProjectRole, ProjectRole>;

export function isProjectOwner(
  role: ProjectRole | string | null | undefined
): role is ProjectRole {
  return role === PROJECT_ROLE.owner;
}

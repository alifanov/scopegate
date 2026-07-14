import { NextResponse } from "next/server";
import type { TeamMember } from "@/generated/prisma/client";
import { db } from "./db";
import { isAdmin } from "./admin";
import {
  authErrorResponse,
  requireCurrentUser,
  ForbiddenError,
  NotFoundError,
  type CurrentUser,
} from "./auth-middleware";
import { isProjectOwner } from "./project-roles";

export type ProjectAccessRole = "member" | "owner";

/**
 * Single source of truth for "can this user act on this project as this role".
 * Admin override applies uniformly: an admin acts as the required role even
 * without a TeamMember row (returns `null` in that case — there is no real
 * membership to hand back).
 */
export async function authorizeProject(
  user: CurrentUser,
  projectId: string,
  role: ProjectAccessRole
): Promise<TeamMember | null> {
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });

  if (member) {
    if (role === "owner" && !isProjectOwner(member.role) && !isAdmin(user.email)) {
      throw new ForbiddenError();
    }
    return member;
  }

  if (isAdmin(user.email)) return null;
  throw new NotFoundError();
}

export type ProjectAuthContext<P> = {
  user: CurrentUser;
  member: TeamMember | null;
  params: P;
};

/**
 * Collapses the repeated auth preamble (current user + params + membership
 * check + error mapping) shared by every project-scoped route handler.
 */
export function withProjectAuth<P extends { projectId: string }>(
  role: ProjectAccessRole,
  handler: (request: Request, ctx: ProjectAuthContext<P>) => Promise<NextResponse>
) {
  return async (
    request: Request,
    routeCtx: { params: Promise<P> }
  ): Promise<NextResponse> => {
    try {
      const user = await requireCurrentUser();
      const params = await routeCtx.params;
      const member = await authorizeProject(user, params.projectId, role);
      return await handler(request, { user, member, params });
    } catch (error) {
      return authErrorResponse(error);
    }
  };
}

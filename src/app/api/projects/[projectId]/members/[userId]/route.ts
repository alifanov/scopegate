import { NextResponse } from "next/server";
import { withProjectAuth } from "@/lib/project-access";
import { removeProjectMember, TeamMembershipError } from "@/lib/team-membership";

export const DELETE = withProjectAuth<{ projectId: string; userId: string }>(
  "owner",
  async (_request, { params: { projectId, userId } }) => {
    try {
      await removeProjectMember(projectId, userId);
    } catch (err) {
      if (err instanceof TeamMembershipError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  }
);

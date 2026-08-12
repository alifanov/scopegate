import { NextResponse } from "next/server";
import { withProjectAuth } from "@/lib/project-access";
import { removeProjectMember } from "@/lib/team-membership";

export const DELETE = withProjectAuth<{ projectId: string; userId: string }>(
  "owner",
  async (_request, { params: { projectId, userId } }) => {
    await removeProjectMember(projectId, userId);
    return NextResponse.json({ success: true });
  }
);

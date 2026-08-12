import { NextResponse } from "next/server";
import { withProjectAuth } from "@/lib/project-access";
import { regenerateEndpointKey } from "@/lib/endpoint-permissions";

// POST /api/projects/[projectId]/endpoints/[endpointId]/regenerate-key
export const POST = withProjectAuth<{ projectId: string; endpointId: string }>(
  "owner",
  async (_request, { params: { projectId, endpointId } }) => {
    const endpoint = await regenerateEndpointKey({ projectId, endpointId });
    return NextResponse.json({ endpoint });
  }
);

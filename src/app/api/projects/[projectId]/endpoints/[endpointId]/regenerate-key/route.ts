import { NextResponse } from "next/server";
import { withProjectAuth } from "@/lib/project-access";
import {
  EndpointPermissionError,
  regenerateEndpointKey,
} from "@/lib/endpoint-permissions";

// POST /api/projects/[projectId]/endpoints/[endpointId]/regenerate-key
export const POST = withProjectAuth<{ projectId: string; endpointId: string }>(
  "owner",
  async (_request, { params: { projectId, endpointId } }) => {
    try {
      const endpoint = await regenerateEndpointKey({ projectId, endpointId });
      return NextResponse.json({ endpoint });
    } catch (error) {
      if (error instanceof EndpointPermissionError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

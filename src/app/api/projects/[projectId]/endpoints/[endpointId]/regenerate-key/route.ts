import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import { generateMcpApiKey } from "@/lib/mcp/api-keys";
import { recordAudit } from "@/lib/audit";

// POST /api/projects/[projectId]/endpoints/[endpointId]/regenerate-key
export const POST = withProjectAuth<{ projectId: string; endpointId: string }>(
  "owner",
  async (_request, { params: { projectId, endpointId } }) => {
    const existing = await db.mcpEndpoint.findFirst({
      where: { id: endpointId, projectId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const endpoint = await db.mcpEndpoint.update({
      where: { id: endpointId },
      data: { apiKey: generateMcpApiKey() },
      select: { id: true, apiKey: true },
    });

    await recordAudit({
      endpointId,
      projectId,
      action: "endpoint:regenerate_key",
      params: { endpointId },
      status: "success",
    });

    return NextResponse.json({ endpoint });
  }
);

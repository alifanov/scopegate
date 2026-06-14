import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth-middleware";
import { requireProjectOwner } from "@/lib/project-auth";
import { generateMcpApiKey } from "@/lib/mcp/api-keys";
import { recordAudit } from "@/lib/audit";

// POST /api/projects/[projectId]/endpoints/[endpointId]/regenerate-key
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; endpointId: string }> }
) {
  let projectId: string;
  let endpointId: string;
  try {
    const user = await requireCurrentUser();
    ({ projectId, endpointId } = await params);
    await requireProjectOwner(user.userId, projectId);
  } catch (error) {
    return authErrorResponse(error);
  }

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

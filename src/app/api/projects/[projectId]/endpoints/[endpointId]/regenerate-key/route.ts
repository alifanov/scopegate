import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { requireProjectOwner } from "@/lib/project-auth";
import { generateMcpApiKey } from "@/lib/mcp/api-keys";

// POST /api/projects/[projectId]/endpoints/[endpointId]/regenerate-key
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; endpointId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, endpointId } = await params;
  const memberOrError = await requireProjectOwner(user.userId, projectId);
  if (memberOrError instanceof NextResponse) return memberOrError;

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

  return NextResponse.json({ endpoint });
}

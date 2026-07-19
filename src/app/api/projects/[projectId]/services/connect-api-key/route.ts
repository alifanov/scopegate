import { NextResponse } from "next/server";
import { withProjectAuth } from "@/lib/project-access";
import { connectApiKey, ServiceConnectError } from "@/lib/service-connect";

// POST /api/projects/[projectId]/services/connect-api-key
export const POST = withProjectAuth<{ projectId: string }>(
  "owner",
  async (request, { params: { projectId } }) => {
    let body: Record<string, string | undefined>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { provider, label, apiKey } = body;

    if (!provider) {
      return NextResponse.json({ error: "Missing provider" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "Missing apiKey" }, { status: 400 });
    }

    try {
      await connectApiKey({ projectId, provider, apiKey, label });
    } catch (err) {
      if (err instanceof ServiceConnectError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  }
);

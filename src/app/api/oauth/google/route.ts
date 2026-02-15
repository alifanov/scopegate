import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-middleware";

// GET /api/oauth/google — initiate Google OAuth flow
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  // TODO: Implement Google OAuth flow
  // 1. Create OAuth2 client with googleapis
  // 2. Generate auth URL with required scopes
  // 3. Store projectId in state parameter
  // 4. Redirect to Google auth URL

  return NextResponse.json(
    { error: "OAuth not yet configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
    { status: 501 }
  );
}

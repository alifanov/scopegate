import { NextResponse } from "next/server";

// GET /api/oauth/google/callback — handle Google OAuth callback
export async function GET() {
  // TODO: Implement Google OAuth callback
  // 1. Exchange code for tokens
  // 2. Get user info from Google
  // 3. Create ServiceConnection
  // 4. Redirect to project services page

  return NextResponse.json(
    { error: "OAuth callback not yet implemented" },
    { status: 501 }
  );
}

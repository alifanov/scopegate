import { NextResponse } from "next/server";
import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildGoogleAuthUrl, VALID_PROVIDERS } from "@/lib/google-oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  return handleOAuthStart(request, {
    buildUrl: (projectId, csrfToken) =>
      buildGoogleAuthUrl(projectId, provider, csrfToken),
  });
}

import { NextResponse } from "next/server";
import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildTwitterAuthUrl, generatePKCE } from "@/lib/twitter-oauth";
import { resolveOAuthApp } from "@/lib/oauth-credentials";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "twitter";

  if (provider !== "twitter" && provider !== "twitterAds") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const { codeVerifier, codeChallenge } = generatePKCE();

  return handleOAuthStart(request, {
    buildUrl: async (projectId, csrfToken) =>
      buildTwitterAuthUrl(
        projectId,
        provider,
        csrfToken,
        codeChallenge,
        await resolveOAuthApp(provider, projectId),
      ),
    extraCookies: [{ name: "twitter_code_verifier", value: codeVerifier }],
  });
}

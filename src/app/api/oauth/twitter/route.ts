import { NextResponse } from "next/server";
import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildTwitterAuthUrl, generatePKCE } from "@/lib/twitter-oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "twitter";

  if (provider !== "twitter" && provider !== "twitterAds") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const { codeVerifier, codeChallenge } = generatePKCE();

  return handleOAuthStart(request, {
    buildUrl: (projectId, csrfToken) =>
      buildTwitterAuthUrl(projectId, provider, csrfToken, codeChallenge),
    extraCookies: [{ name: "twitter_code_verifier", value: codeVerifier }],
  });
}

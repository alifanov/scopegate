import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { buildTwitterAuthUrl, generatePKCE } from "@/lib/twitter-oauth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const provider = searchParams.get("provider") || "twitter";

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId" },
      { status: 400 }
    );
  }

  if (provider !== "twitter" && provider !== "twitterAds") {
    return NextResponse.json(
      { error: "Invalid provider" },
      { status: 400 }
    );
  }

  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const csrfToken = crypto.randomUUID();
  const { codeVerifier, codeChallenge } = generatePKCE();
  const twitterUrl = buildTwitterAuthUrl(projectId, provider, csrfToken, codeChallenge);

  const response = NextResponse.redirect(twitterUrl);
  response.cookies.set("oauth_csrf", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  response.cookies.set("twitter_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}

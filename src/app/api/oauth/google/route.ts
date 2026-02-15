import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { buildGoogleAuthUrl, VALID_PROVIDERS } from "@/lib/google-oauth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const provider = searchParams.get("provider");

  if (!projectId || !provider) {
    return NextResponse.json(
      { error: "Missing projectId or provider" },
      { status: 400 }
    );
  }

  if (!VALID_PROVIDERS.includes(provider)) {
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
  const googleUrl = buildGoogleAuthUrl(projectId, provider, csrfToken);

  const response = NextResponse.redirect(googleUrl);
  response.cookies.set("oauth_csrf", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}

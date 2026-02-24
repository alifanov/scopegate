import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { buildLinkedInAuthUrl } from "@/lib/linkedin-oauth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId" },
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
  const linkedInUrl = buildLinkedInAuthUrl(projectId, csrfToken);

  const response = NextResponse.redirect(linkedInUrl);
  response.cookies.set("oauth_csrf", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}

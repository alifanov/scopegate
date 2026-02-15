import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import {
  exchangeCodeForTokens,
  getGoogleUserEmail,
  VALID_PROVIDERS,
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  // Google returned an error (e.g. user denied consent)
  if (error) {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  // Decode state
  let state: { projectId: string; provider: string; csrfToken: string };
  try {
    state = JSON.parse(atob(stateParam));
  } catch {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  const { projectId, provider, csrfToken } = state;

  if (!projectId || !provider || !csrfToken) {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}/services?error=oauth_failed`
    );
  }

  // Verify CSRF
  const cookies = request.headers.get("cookie") || "";
  const csrfCookie = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("oauth_csrf="));
  const csrfValue = csrfCookie?.split("=")[1];

  if (!csrfValue || csrfValue !== csrfToken) {
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}/services?error=oauth_failed`
    );
  }

  // Auth check
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  // Membership check
  const member = await db.teamMember.findUnique({
    where: {
      userId_projectId: { userId: user.userId, projectId },
    },
  });
  if (!member) {
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}/services?error=oauth_failed`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const accountEmail = await getGoogleUserEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert: update existing connection or create new
    const existing = await db.serviceConnection.findFirst({
      where: { projectId, provider, accountEmail },
    });

    if (existing) {
      await db.serviceConnection.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    } else {
      await db.serviceConnection.create({
        data: {
          projectId,
          provider,
          accountEmail,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    }

    // Clear CSRF cookie and redirect to services page
    const response = NextResponse.redirect(
      `${baseUrl}/projects/${projectId}/services`
    );
    response.cookies.set("oauth_csrf", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}/services?error=oauth_failed`
    );
  }
}

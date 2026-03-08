import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import {
  exchangeJiraCodeForTokens,
  getJiraCloudInfo,
} from "@/lib/jira-oauth";
import { encrypt } from "@/lib/crypto";

export async function GET(request: Request) {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  let state: { projectId: string; provider: string; csrfToken: string };
  try {
    state = JSON.parse(atob(stateParam));
  } catch {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  const { projectId, provider, csrfToken } = state;

  if (!projectId || provider !== "jira" || !csrfToken) {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  const cookies = request.headers.get("cookie") || "";
  const csrfCookie = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("oauth_csrf="));
  const csrfValue = csrfCookie?.split("=")[1];

  if (!csrfValue || csrfValue !== csrfToken) {
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const member = await db.teamMember.findUnique({
    where: {
      userId_projectId: { userId: user.userId, projectId },
    },
  });
  if (!member) {
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`
    );
  }

  try {
    const tokens = await exchangeJiraCodeForTokens(code);
    const cloudInfo = await getJiraCloudInfo(tokens.access_token);
    const accountEmail = cloudInfo.name;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const existing = await db.serviceConnection.findFirst({
      where: { projectId, provider: "jira", accountEmail },
    });

    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);
    const metadata = {
      jiraCloudId: cloudInfo.cloudId,
      jiraSiteName: cloudInfo.name,
      jiraSiteUrl: cloudInfo.url,
    };

    if (existing) {
      await db.serviceConnection.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          metadata,
          status: "active",
          lastError: null,
        },
      });
    } else {
      await db.serviceConnection.create({
        data: {
          projectId,
          provider: "jira",
          accountEmail,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          metadata,
        },
      });
    }

    const response = NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services`
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
    console.error("Jira OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`
    );
  }
}

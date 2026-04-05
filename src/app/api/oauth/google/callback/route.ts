import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import {
  exchangeCodeForTokens,
  getGoogleUserEmail,
  VALID_PROVIDERS,
} from "@/lib/google-oauth";
import { encrypt } from "@/lib/crypto";
import { listAccessibleCustomers } from "@/lib/mcp/google-ads";

export async function GET(request: Request) {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  // Google returned an error (e.g. user denied consent)
  if (error) {
    console.error("[ScopeGate] Google OAuth error:", error, searchParams.get("error_description"));
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  if (!code || !stateParam) {
    console.error("[ScopeGate] OAuth callback missing params — code:", !!code, "state:", !!stateParam);
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  // Decode state
  let state: { projectId: string; provider: string; csrfToken: string };
  try {
    state = JSON.parse(atob(stateParam));
  } catch (err) {
    console.error("[ScopeGate] Failed to decode OAuth state:", err);
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  const { projectId, provider, csrfToken } = state;

  if (!projectId || !provider || !csrfToken) {
    console.error("[ScopeGate] Incomplete OAuth state — projectId:", !!projectId, "provider:", !!provider, "csrfToken:", !!csrfToken);
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  if (!VALID_PROVIDERS.includes(provider)) {
    console.error("[ScopeGate] Invalid OAuth provider:", provider);
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`
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
    console.error("[ScopeGate] CSRF mismatch — cookie present:", !!csrfValue, "match:", csrfValue === csrfToken);
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`
    );
  }

  // Auth check
  const user = await getCurrentUser();
  if (!user) {
    console.error("[ScopeGate] OAuth callback — user not authenticated");
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  // Membership check
  const member = await db.teamMember.findUnique({
    where: {
      userId_projectId: { userId: user.userId, projectId },
    },
  });
  if (!member) {
    console.error("[ScopeGate] OAuth callback — user not a member of project:", projectId);
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const accountEmail = await getGoogleUserEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    let connectionId: string;
    if (provider === "googleAds") {
      // For Google Ads, always create a new temp connection.
      // Deduplication happens once the customer ID is known (below or in ads-customers route).
      const created = await db.serviceConnection.create({
        data: {
          projectId,
          provider,
          accountEmail,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
        },
      });
      connectionId = created.id;
    } else {
      // For other providers: upsert by (projectId, provider, accountEmail)
      const existing = await db.serviceConnection.findFirst({
        where: { projectId, provider, accountEmail },
      });
      if (existing) {
        await db.serviceConnection.update({
          where: { id: existing.id },
          data: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            expiresAt,
            status: "active",
            lastError: null,
          },
        });
        connectionId = existing.id;
      } else {
        const created = await db.serviceConnection.create({
          data: {
            projectId,
            provider,
            accountEmail,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            expiresAt,
          },
        });
        connectionId = created.id;
      }
    }

    // For Google Ads, discover customer IDs and handle selection flow
    if (provider === "googleAds") {
      try {
        const customers = await listAccessibleCustomers(connectionId);

        const clearCsrf = (r: ReturnType<typeof NextResponse.redirect>) => {
          r.cookies.set("oauth_csrf", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/",
          });
          return r;
        };

        if (customers.length === 0) {
          await db.serviceConnection.delete({ where: { id: connectionId } });
          return clearCsrf(
            NextResponse.redirect(
              `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`
            )
          );
        }

        if (customers.length === 1) {
          const customerId = customers[0].id;
          const customerName = customers[0].name;
          // Check if another connection already tracks this customer — if so, refresh its tokens
          const duplicate = await db.serviceConnection.findFirst({
            where: { projectId, provider, accountEmail, id: { not: connectionId } },
          });
          const dupCustomerId = (duplicate?.metadata as Record<string, unknown> | null)?.googleAdsCustomerId;
          if (duplicate && dupCustomerId === customerId) {
            await db.serviceConnection.update({
              where: { id: duplicate.id },
              data: {
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                expiresAt,
                status: "active",
                lastError: null,
                metadata: { ...(duplicate.metadata as Record<string, unknown> ?? {}), googleAdsCustomerId: customerId, googleAdsCustomerName: customerName },
              },
            });
            await db.serviceConnection.delete({ where: { id: connectionId } });
          } else {
            await db.serviceConnection.update({
              where: { id: connectionId },
              data: {
                metadata: { googleAdsCustomerId: customerId, googleAdsCustomerName: customerName },
              },
            });
          }
          // Fall through to normal redirect below
        } else {
          // Multiple accounts — let user choose
          return clearCsrf(
            NextResponse.redirect(
              `${baseUrl}/projects/${projectId}/select-ads-account?connectionId=${connectionId}`
            )
          );
        }
      } catch (err) {
        console.error("[ScopeGate] Failed to discover Google Ads customers:", err);
        // Continue with normal redirect on error
      }
    }

    // Clear CSRF cookie and redirect to services page
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
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`
    );
  }
}

import { handleOAuthCallback } from "@/lib/oauth-flow";
import { exchangeTwitterCodeForTokens, getTwitterUserInfo } from "@/lib/twitter-oauth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
    expectedProvider: ["twitter", "twitterAds"],
    extraCookiesToRead: ["twitter_code_verifier"],
    extraCookiesToClear: ["twitter_code_verifier"],
    exchange: (code, ctx) =>
      exchangeTwitterCodeForTokens(code, ctx.extras.twitter_code_verifier),
    getConnectionData: async (tokens) => {
      const userInfo = await getTwitterUserInfo(tokens.access_token);
      return {
        accountEmail: `@${userInfo.username}`,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        refreshToken: tokens.refresh_token ?? null,
      };
    },
    // Twitter: one connection per (project, provider), not per account email
    persist: async ({ projectId, provider, connectionData, encryptedAccessToken, encryptedRefreshToken }) => {
      const existing = await db.serviceConnection.findFirst({
        where: { projectId, provider },
      });
      if (existing) {
        await db.serviceConnection.update({
          where: { id: existing.id },
          data: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            accountEmail: connectionData.accountEmail,
            expiresAt: connectionData.expiresAt ?? null,
            status: "active",
            lastError: null,
          },
        });
        return existing.id;
      }
      const created = await db.serviceConnection.create({
        data: {
          projectId,
          provider,
          accountEmail: connectionData.accountEmail,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: connectionData.expiresAt ?? null,
        },
      });
      return created.id;
    },
  });
}

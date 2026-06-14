import { handleOAuthCallback, persistOAuthConnection } from "@/lib/oauth-flow";
import { exchangeCodeForTokens, getGoogleUserEmail, VALID_PROVIDERS } from "@/lib/google-oauth";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { listAccessibleCustomers } from "@/lib/mcp/google-ads";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
    expectedProvider: VALID_PROVIDERS,
    exchange: (code) => exchangeCodeForTokens(code),
    getConnectionData: async (tokens) => {
      const accountEmail = await getGoogleUserEmail(tokens.access_token);
      return {
        accountEmail,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        refreshToken: tokens.refresh_token,
      };
    },
    // Google Ads: always create a fresh connection; other Google providers: standard upsert
    persist: async ({ projectId, provider, connectionData, encryptedAccessToken, encryptedRefreshToken }) => {
      const { accountEmail, expiresAt } = connectionData;

      if (provider === "googleAds") {
        const created = await db.serviceConnection.create({
          data: {
            projectId,
            provider,
            accountEmail,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            expiresAt: expiresAt ?? null,
          },
        });
        return created.id;
      }

      return persistOAuthConnection({
        projectId,
        provider,
        connectionData,
        encryptedAccessToken,
        encryptedRefreshToken,
      });
    },
    afterPersist: async ({ connectionId, tokens, connectionData, ctx, clearAndRedirect }) => {
      if (ctx.provider !== "googleAds") return null;

      const { projectId, provider, baseUrl } = ctx;
      const { accountEmail, expiresAt } = connectionData;

      try {
        const customers = await listAccessibleCustomers(connectionId);

        if (customers.length === 0) {
          await db.serviceConnection.delete({ where: { id: connectionId } });
          return clearAndRedirect(
            `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`,
          );
        }

        if (customers.length >= 2) {
          return clearAndRedirect(
            `${baseUrl}/projects/${projectId}/select-ads-account?connectionId=${connectionId}`,
          );
        }

        // Single customer — dedup against existing connections
        const [{ id: customerId, name: customerName }] = customers;
        const duplicate = await db.serviceConnection.findFirst({
          where: { projectId, provider, accountEmail, id: { not: connectionId } },
        });
        const dupCustomerId = (
          duplicate?.metadata as Record<string, unknown> | null
        )?.googleAdsCustomerId;

        if (duplicate && dupCustomerId === customerId) {
          const encAT = encrypt(tokens.access_token);
          const encRT = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
          await db.serviceConnection.update({
            where: { id: duplicate.id },
            data: {
              accessToken: encAT,
              refreshToken: encRT,
              expiresAt: expiresAt ?? null,
              status: "active",
              lastError: null,
              metadata: {
                ...(duplicate.metadata as Record<string, unknown> ?? {}),
                googleAdsCustomerId: customerId,
                googleAdsCustomerName: customerName,
              },
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

        return null; // fall through to default redirect
      } catch (err) {
        console.error("[ScopeGate] Failed to discover Google Ads customers:", err);
        return null;
      }
    },
  });
}

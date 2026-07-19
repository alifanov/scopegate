import type { OAuthCallbackOpts } from "@/lib/oauth-flow";
import type { OAuthCallbackRouteKey } from "@/lib/provider-registry";

type OAuthCallbackFactory = () => Promise<OAuthCallbackOpts>;

const OAUTH_CALLBACK_REGISTRY: Record<OAuthCallbackRouteKey, OAuthCallbackFactory> = {
  github: async () => {
    const { exchangeGitHubCodeForTokens, getGitHubUserInfo } = await import(
      "@/lib/github-oauth"
    );
    return {
      expectedProvider: "github",
      exchange: (code) => exchangeGitHubCodeForTokens(code),
      getConnectionData: async (tokens) => {
        const userInfo = await getGitHubUserInfo(tokens.access_token);
        return {
          accountEmail: userInfo.email || userInfo.login,
          expiresAt: null,
          refreshToken: null,
        };
      },
    };
  },
  google: async () => {
    const { exchangeCodeForTokens, getGoogleUserEmail, parseEmailFromIdToken, VALID_PROVIDERS } = await import(
      "@/lib/google-oauth"
    );
    const { persistOAuthConnection } = await import("@/lib/oauth-flow");
    const { encrypt } = await import("@/lib/crypto");
    const { db } = await import("@/lib/db");
    const { listAccessibleCustomers, googleAdsAccountEmail } = await import(
      "@/lib/mcp/google-ads"
    );

    return {
      expectedProvider: VALID_PROVIDERS,
      exchange: (code) => exchangeCodeForTokens(code),
      getConnectionData: async (tokens) => {
        // Prefer id_token (already in hand from token exchange) to avoid a second network call.
        const accountEmail =
          (tokens.id_token ? parseEmailFromIdToken(tokens.id_token) : null) ??
          (await getGoogleUserEmail(tokens.access_token));
        return {
          accountEmail,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
          refreshToken: tokens.refresh_token,
        };
      },
      persist: async ({
        projectId,
        provider,
        connectionData,
        encryptedAccessToken,
        encryptedRefreshToken,
      }) => {
        const { accountEmail, expiresAt } = connectionData;

        if (provider === "googleAds") {
          // customerId (the real dedupe key for googleAds) is only known after a follow-up
          // API call in afterPersist, so insert under a temp-unique accountEmail — one Google
          // login can legitimately back multiple ad-customer connections — and finalize below.
          const created = await db.serviceConnection.create({
            data: {
              projectId,
              provider,
              accountEmail: `${accountEmail}#pending:${crypto.randomUUID()}`,
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
            // accountEmail stays pending — which customerId this row ends up under isn't known
            // until the user picks one via ads-customers/route.ts, which finalizes it then.
            return clearAndRedirect(
              `${baseUrl}/projects/${projectId}/select-ads-account?connectionId=${connectionId}`,
            );
          }

          const [{ id: customerId, name: customerName }] = customers;
          // accountEmail encodes the customerId, so a match on it already means the same Ads
          // account — no need to compare metadata.
          const finalEmail = googleAdsAccountEmail(accountEmail, customerId);
          const duplicate = await db.serviceConnection.findFirst({
            where: { projectId, provider, accountEmail: finalEmail, id: { not: connectionId } },
          });

          if (duplicate) {
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
                  ...((duplicate.metadata as Record<string, unknown>) ?? {}),
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
                accountEmail: finalEmail,
                metadata: { googleAdsCustomerId: customerId, googleAdsCustomerName: customerName },
              },
            });
          }

          return null;
        } catch (err) {
          console.error("[ScopeGate] Failed to discover Google Ads customers:", err);
          return null;
        }
      },
    };
  },
  hubspot: async () => {
    const { exchangeHubSpotCodeForTokens, getHubSpotUserInfo } = await import(
      "@/lib/hubspot-oauth"
    );
    return {
      expectedProvider: "hubspot",
      exchange: (code) => exchangeHubSpotCodeForTokens(code),
      getConnectionData: async (tokens) => {
        const userInfo = await getHubSpotUserInfo(tokens.access_token);
        return {
          accountEmail: `${userInfo.user} (${userInfo.hub_domain})`,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
          refreshToken: tokens.refresh_token,
        };
      },
    };
  },
  instagram: async () => {
    const { exchangeInstagramCodeForTokens, getInstagramUserInfo } = await import(
      "@/lib/instagram-oauth"
    );
    return {
      expectedProvider: "instagram",
      exchange: (code) => exchangeInstagramCodeForTokens(code),
      getConnectionData: async (tokens) => {
        const tokenData = tokens as typeof tokens & { user_id: number | string };
        const userInfo = await getInstagramUserInfo(tokens.access_token);
        return {
          accountEmail: userInfo.username || `instagram:${userInfo.id}`,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
          refreshToken: null,
          metadata: { instagramUserId: String(tokenData.user_id) },
        };
      },
    };
  },
  jira: async () => {
    const { exchangeJiraCodeForTokens, getJiraCloudInfo } = await import(
      "@/lib/jira-oauth"
    );
    return {
      expectedProvider: "jira",
      exchange: (code) => exchangeJiraCodeForTokens(code),
      getConnectionData: async (tokens) => {
        const cloudInfo = await getJiraCloudInfo(tokens.access_token);
        return {
          accountEmail: cloudInfo.name,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
          refreshToken: tokens.refresh_token,
          metadata: {
            jiraCloudId: cloudInfo.cloudId,
            jiraSiteName: cloudInfo.name,
            jiraSiteUrl: cloudInfo.url,
          },
        };
      },
    };
  },
  linkedin: async () => {
    const { exchangeLinkedInCodeForTokens, getLinkedInUserInfo } = await import(
      "@/lib/linkedin-oauth"
    );
    return {
      expectedProvider: "linkedin",
      exchange: (code) => exchangeLinkedInCodeForTokens(code),
      getConnectionData: async (tokens) => {
        const userInfo = await getLinkedInUserInfo(tokens.access_token);
        return {
          accountEmail: userInfo.email,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
          refreshToken: tokens.refresh_token ?? null,
          metadata: { linkedinMemberUrn: `urn:li:person:${userInfo.sub}` },
        };
      },
    };
  },
  meta: async () => {
    const { exchangeMetaCodeForTokens, getMetaUserInfo } = await import(
      "@/lib/meta-oauth"
    );
    return {
      expectedProvider: "metaAds",
      exchange: (code) => exchangeMetaCodeForTokens(code),
      getConnectionData: async (tokens) => {
        const userInfo = await getMetaUserInfo(tokens.access_token);
        return {
          accountEmail: userInfo.email || userInfo.name,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
          refreshToken: null,
        };
      },
    };
  },
  notion: async () => {
    const { exchangeNotionCodeForTokens } = await import("@/lib/notion-oauth");
    return {
      expectedProvider: "notion",
      exchange: (code) => exchangeNotionCodeForTokens(code),
      getConnectionData: async (tokens) => ({
        accountEmail:
          (tokens as { owner?: { user?: { person?: { email?: string } } } }).owner?.user?.person
            ?.email ||
          (tokens as { workspace_name?: string }).workspace_name ||
          "Notion workspace",
        expiresAt: null,
        refreshToken: null,
      }),
    };
  },
  salesforce: async () => {
    const { exchangeSalesforceCodeForTokens, getSalesforceUserInfo } = await import(
      "@/lib/salesforce-oauth"
    );
    return {
      expectedProvider: "salesforce",
      exchange: (code) => exchangeSalesforceCodeForTokens(code),
      getConnectionData: async (tokens) => {
        const tokenData = tokens as typeof tokens & { id: string; instance_url: string };
        const userInfo = await getSalesforceUserInfo(tokens.access_token, tokenData.id);
        return {
          accountEmail: userInfo.email,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          refreshToken: tokens.refresh_token,
          metadata: { salesforceInstanceUrl: tokenData.instance_url },
        };
      },
    };
  },
  slack: async () => {
    const { exchangeSlackCodeForTokens, getSlackTeamInfo } = await import(
      "@/lib/slack-oauth"
    );
    return {
      expectedProvider: "slack",
      exchange: (code) => exchangeSlackCodeForTokens(code),
      getConnectionData: async (tokens) => {
        const teamInfo = await getSlackTeamInfo(tokens.access_token);
        return {
          accountEmail: `${teamInfo.team} (${teamInfo.user})`,
          expiresAt: null,
          refreshToken: null,
        };
      },
    };
  },
  threads: async () => {
    const { exchangeThreadsCodeForTokens, getThreadsUserInfo } = await import(
      "@/lib/threads-oauth"
    );
    return {
      expectedProvider: "threads",
      exchange: (code) => exchangeThreadsCodeForTokens(code),
      getConnectionData: async (tokens) => {
        const tokenData = tokens as typeof tokens & { user_id: number };
        const userInfo = await getThreadsUserInfo(tokens.access_token);
        return {
          accountEmail: userInfo.username || `threads:${userInfo.id}`,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
          refreshToken: null,
          metadata: { threadsUserId: String(tokenData.user_id) },
        };
      },
    };
  },
  twitter: async () => {
    const { exchangeTwitterCodeForTokens, getTwitterUserInfo } = await import(
      "@/lib/twitter-oauth"
    );

    return {
      expectedProvider: ["twitter", "twitterAds"],
      extraCookiesToRead: ["twitter_code_verifier"],
      extraCookiesToClear: ["twitter_code_verifier"],
      exchange: (code, ctx) =>
        exchangeTwitterCodeForTokens(code, ctx.extras.twitter_code_verifier),
      getConnectionData: async (tokens) => {
        const userInfo = await getTwitterUserInfo(tokens.access_token);
        return {
          accountEmail: `@${userInfo.username}`,
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
          refreshToken: tokens.refresh_token ?? null,
        };
      },
      // No custom persist: falls back to the default accountEmail-keyed upsert,
      // so multiple Twitter accounts in the same project no longer overwrite each other.
    };
  },
};

export function getOAuthCallbackConfig(routeKey: OAuthCallbackRouteKey): Promise<OAuthCallbackOpts> {
  return OAUTH_CALLBACK_REGISTRY[routeKey]();
}

import { handleOAuthCallback } from "@/lib/oauth-flow";
import { exchangeSalesforceCodeForTokens, getSalesforceUserInfo } from "@/lib/salesforce-oauth";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
    expectedProvider: "salesforce",
    exchange: (code) => exchangeSalesforceCodeForTokens(code),
    getConnectionData: async (tokens) => {
      const userInfo = await getSalesforceUserInfo(tokens.access_token, tokens.id);
      return {
        accountEmail: userInfo.email,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        refreshToken: tokens.refresh_token,
        metadata: { salesforceInstanceUrl: tokens.instance_url },
      };
    },
  });
}

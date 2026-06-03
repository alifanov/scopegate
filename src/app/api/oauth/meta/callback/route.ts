import { handleOAuthCallback } from "@/lib/oauth-flow";
import { exchangeMetaCodeForTokens, getMetaUserInfo } from "@/lib/meta-oauth";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
    expectedProvider: "metaAds",
    exchange: (code) => exchangeMetaCodeForTokens(code),
    getConnectionData: async (tokens) => {
      const userInfo = await getMetaUserInfo(tokens.access_token);
      return {
        accountEmail: userInfo.email || userInfo.name,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        refreshToken: null,
      };
    },
  });
}

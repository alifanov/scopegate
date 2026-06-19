import { handleOAuthCallback } from "@/lib/oauth-flow";
import { exchangeLinkedInCodeForTokens, getLinkedInUserInfo } from "@/lib/linkedin-oauth";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
    expectedProvider: "linkedin",
    exchange: (code) => exchangeLinkedInCodeForTokens(code),
    getConnectionData: async (tokens) => {
      const userInfo = await getLinkedInUserInfo(tokens.access_token);
      return {
        accountEmail: userInfo.email,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        refreshToken: tokens.refresh_token ?? null,
        metadata: { linkedinMemberUrn: `urn:li:person:${userInfo.sub}` },
      };
    },
  });
}

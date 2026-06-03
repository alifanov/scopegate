import { handleOAuthCallback } from "@/lib/oauth-flow";
import { exchangeGitHubCodeForTokens, getGitHubUserInfo } from "@/lib/github-oauth";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
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
  });
}

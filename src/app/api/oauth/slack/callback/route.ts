import { handleOAuthCallback } from "@/lib/oauth-flow";
import { exchangeSlackCodeForTokens, getSlackTeamInfo } from "@/lib/slack-oauth";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
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
  });
}

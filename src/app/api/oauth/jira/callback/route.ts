import { handleOAuthCallback } from "@/lib/oauth-flow";
import { exchangeJiraCodeForTokens, getJiraCloudInfo } from "@/lib/jira-oauth";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
    expectedProvider: "jira",
    exchange: (code) => exchangeJiraCodeForTokens(code),
    getConnectionData: async (tokens) => {
      const cloudInfo = await getJiraCloudInfo(tokens.access_token);
      return {
        accountEmail: cloudInfo.name,
        expiresAt: new Date(Date.now() + tokens.expires_in! * 1000),
        refreshToken: tokens.refresh_token,
        metadata: {
          jiraCloudId: cloudInfo.cloudId,
          jiraSiteName: cloudInfo.name,
          jiraSiteUrl: cloudInfo.url,
        },
      };
    },
  });
}

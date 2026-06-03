import { handleOAuthCallback } from "@/lib/oauth-flow";
import { exchangeThreadsCodeForTokens, getThreadsUserInfo } from "@/lib/threads-oauth";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
    expectedProvider: "threads",
    exchange: (code) => exchangeThreadsCodeForTokens(code),
    getConnectionData: async (tokens) => {
      const userInfo = await getThreadsUserInfo(tokens.access_token);
      return {
        accountEmail: userInfo.username || `threads:${userInfo.id}`,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        refreshToken: null,
        metadata: { threadsUserId: String(tokens.user_id) },
      };
    },
  });
}

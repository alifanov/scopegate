import { handleOAuthCallback } from "@/lib/oauth-flow";
import { exchangeNotionCodeForTokens } from "@/lib/notion-oauth";

export async function GET(request: Request) {
  return handleOAuthCallback(request, {
    expectedProvider: "notion",
    exchange: (code) => exchangeNotionCodeForTokens(code),
    getConnectionData: async (tokens) => ({
      accountEmail: tokens.owner?.user?.person?.email || tokens.workspace_name,
      expiresAt: null,
      refreshToken: null,
    }),
  });
}

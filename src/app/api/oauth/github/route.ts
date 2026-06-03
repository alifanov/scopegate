import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildGitHubAuthUrl } from "@/lib/github-oauth";

export async function GET(request: Request) {
  return handleOAuthStart(request, { buildUrl: buildGitHubAuthUrl });
}

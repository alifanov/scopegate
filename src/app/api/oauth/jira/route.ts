import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildJiraAuthUrl } from "@/lib/jira-oauth";

export async function GET(request: Request) {
  return handleOAuthStart(request, { buildUrl: buildJiraAuthUrl });
}

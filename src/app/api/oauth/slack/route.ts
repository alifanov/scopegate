import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildSlackAuthUrl } from "@/lib/slack-oauth";

export async function GET(request: Request) {
  return handleOAuthStart(request, { buildUrl: buildSlackAuthUrl });
}

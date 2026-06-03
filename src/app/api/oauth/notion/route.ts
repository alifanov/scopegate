import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildNotionAuthUrl } from "@/lib/notion-oauth";

export async function GET(request: Request) {
  return handleOAuthStart(request, { buildUrl: buildNotionAuthUrl });
}

import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildThreadsAuthUrl } from "@/lib/threads-oauth";

export async function GET(request: Request) {
  return handleOAuthStart(request, { buildUrl: buildThreadsAuthUrl });
}

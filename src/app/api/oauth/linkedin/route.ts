import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildLinkedInAuthUrl } from "@/lib/linkedin-oauth";

export async function GET(request: Request) {
  return handleOAuthStart(request, { buildUrl: buildLinkedInAuthUrl });
}

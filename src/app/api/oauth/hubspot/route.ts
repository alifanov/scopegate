import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildHubSpotAuthUrl } from "@/lib/hubspot-oauth";

export async function GET(request: Request) {
  return handleOAuthStart(request, { buildUrl: buildHubSpotAuthUrl });
}

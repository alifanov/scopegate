import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildMetaAuthUrl } from "@/lib/meta-oauth";

export async function GET(request: Request) {
  return handleOAuthStart(request, { buildUrl: buildMetaAuthUrl });
}

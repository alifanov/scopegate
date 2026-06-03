import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildSalesforceAuthUrl } from "@/lib/salesforce-oauth";

export async function GET(request: Request) {
  return handleOAuthStart(request, { buildUrl: buildSalesforceAuthUrl });
}

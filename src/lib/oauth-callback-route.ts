import { handleOAuthCallback } from "@/lib/oauth-flow";
import { getOAuthCallbackConfig } from "@/lib/oauth-callback-config";
import {
  type OAuthCallbackRouteKey,
} from "@/lib/provider-registry";

export function createOAuthCallbackRoute(routeKey: OAuthCallbackRouteKey) {
  return async function GET(request: Request) {
    const opts = await getOAuthCallbackConfig(routeKey);
    return handleOAuthCallback(request, opts);
  };
}

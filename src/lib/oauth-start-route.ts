import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildSignedState } from "@/lib/oauth-state";
import { getOAuthStartConfig, type OAuthCallbackRouteKey } from "@/lib/provider-registry";

export function createOAuthStartRoute(routeKey: OAuthCallbackRouteKey) {
  return async function GET(request: Request) {
    const config = getOAuthStartConfig(routeKey);
    const redirectUri = `${process.env.BETTER_AUTH_URL}/api/oauth/${routeKey}/callback`;

    return handleOAuthStart(request, {
      buildUrl: (projectId, csrfToken) => {
        const state = buildSignedState({
          projectId,
          provider: config.stateProvider,
          csrfToken,
        });
        const params = new URLSearchParams({
          client_id: process.env[config.clientIdEnv]!,
          redirect_uri: redirectUri,
          state,
          ...(config.scope ? { scope: config.scope } : {}),
          ...config.extraParams,
        });
        return `${config.authorizeUrl}?${params.toString()}`;
      },
    });
  };
}

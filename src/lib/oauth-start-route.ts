import { handleOAuthStart } from "@/lib/oauth-flow";
import { buildSignedState } from "@/lib/oauth-state";
import { resolveOAuthApp } from "@/lib/oauth-credentials";
import { getOAuthStartConfig, type OAuthCallbackRouteKey } from "@/lib/provider-registry";

export function createOAuthStartRoute(routeKey: OAuthCallbackRouteKey) {
  return async function GET(request: Request) {
    const config = getOAuthStartConfig(routeKey);
    const redirectUri = `${process.env.BETTER_AUTH_URL}/api/oauth/${routeKey}/callback`;

    return handleOAuthStart(request, {
      buildUrl: async (projectId, csrfToken) => {
        // stateProvider is the registry key (matches the callback's
        // ctx.provider, e.g. "metaAds" for the "meta" route) — same key
        // oauth-callback-config.ts resolves credentials with.
        const { clientId } = await resolveOAuthApp(config.stateProvider, projectId);
        const state = buildSignedState({
          projectId,
          provider: config.stateProvider,
          csrfToken,
        });
        const params = new URLSearchParams({
          client_id: clientId,
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

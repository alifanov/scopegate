import { OAuthTokenError } from "@/lib/oauth-token-lifecycle";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { getProviderDef } from "@/lib/provider-registry";

// Meta error codes that indicate a dead token, defined once in PROVIDER_REGISTRY.
const META_TOKEN_ERROR_CODES = getProviderDef("metaAds")?.oauthErrors?.permanentCodes ?? [];

type MetaGraphError = { error?: { code?: number; message?: string } };

export async function metaAdsFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as MetaGraphError;
    const errorCode = body?.error?.code;
    const errorMessage = body?.error?.message ?? "Meta Ads API request failed";
    if (errorCode !== undefined && META_TOKEN_ERROR_CODES.includes(errorCode)) {
      throw new OAuthTokenError(
        `Meta token expired or revoked (code ${errorCode}): ${errorMessage}`,
        { provider: "metaAds", code: errorCode }
      );
    }
    throw new Error(`Meta Ads API error (${res.status}) code=${errorCode}: ${errorMessage}`);
  }

  return res.json();
}

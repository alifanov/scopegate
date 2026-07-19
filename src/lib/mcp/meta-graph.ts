import { trace } from "@opentelemetry/api";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { OAuthTokenError } from "@/lib/oauth-token-lifecycle";
import { getProviderDef } from "@/lib/provider-registry";

type MetaGraphErrorBody = { error?: { code?: number; message?: string } };

// Shared across every Meta Graph API surface (Threads, Instagram, Meta Ads): carries
// the HTTP status + Meta error code so callers can distinguish a transient server-side
// failure (5xx, or code 1 "unknown error" / 2 "service unavailable" — which Meta
// routinely emits and a retry clears) from a real, non-retriable rejection.
export class MetaGraphApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number
  ) {
    super(message);
    this.name = "MetaGraphApiError";
  }

  get isTransient(): boolean {
    return this.status >= 500 || this.code === 1 || this.code === 2;
  }
}

// Dead-token codes (e.g. Meta 190/102, Threads/Instagram 190/102) come from
// PROVIDER_REGISTRY[providerKey].oauthErrors.permanentCodes — one place, not
// duplicated per provider file.
export async function metaGraphFetch(
  providerKey: string,
  label: string,
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const permanentCodes = getProviderDef(providerKey)?.oauthErrors?.permanentCodes ?? [];
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as MetaGraphErrorBody;
    const errorCode = body?.error?.code;
    const errorMessage = body?.error?.message ?? `${label} API request failed`;
    trace.getActiveSpan()?.setAttribute("error.type", String(errorCode ?? res.status));
    if (errorCode !== undefined && permanentCodes.includes(errorCode)) {
      throw new OAuthTokenError(
        `${label} token expired or revoked (code ${errorCode}): ${errorMessage}`,
        { provider: providerKey, code: errorCode }
      );
    }
    throw new MetaGraphApiError(
      `${label} API error (${res.status}) code=${errorCode}: ${errorMessage}`,
      res.status,
      errorCode
    );
  }

  return res.json();
}

import { trace } from "@opentelemetry/api";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { OAuthTokenError } from "@/lib/oauth-token-lifecycle";
import { getProviderDef } from "@/lib/provider-registry";

// Meta error codes that indicate a dead token, defined once in PROVIDER_REGISTRY.
const META_TOKEN_ERROR_CODES = getProviderDef("instagram")?.oauthErrors?.permanentCodes ?? [];

type MetaGraphError = { error?: { code?: number; message?: string } };

// Carries the HTTP status + Meta error code so callers can distinguish a transient
// server-side failure (5xx / code 1|2) from a real, non-retriable rejection.
export class InstagramApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number
  ) {
    super(message);
    this.name = "InstagramApiError";
  }

  get isTransient(): boolean {
    return this.status >= 500 || this.code === 1 || this.code === 2;
  }
}

const INSTAGRAM_DEFAULT_TIMEOUT_MS =
  getProviderDef("instagram")?.transport?.timeoutMs ?? 8_000;

export async function instagramFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  try {
    const res = await serviceFetch(serviceConnectionId, path, {
      timeout: INSTAGRAM_DEFAULT_TIMEOUT_MS,
      ...init,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as MetaGraphError;
      const errorCode = body?.error?.code;
      const errorMessage = body?.error?.message ?? "Instagram API request failed";
      trace.getActiveSpan()?.setAttribute("error.type", String(errorCode ?? res.status));
      if (errorCode !== undefined && META_TOKEN_ERROR_CODES.includes(errorCode)) {
        throw new OAuthTokenError(
          `Instagram token expired or revoked (code ${errorCode}): ${errorMessage}`,
          { provider: "instagram", code: errorCode }
        );
      }
      throw new InstagramApiError(
        `Instagram API error (${res.status}) code=${errorCode}: ${errorMessage}`,
        res.status,
        errorCode
      );
    }

    return res.json();
  } catch (err) {
    if (err instanceof OAuthTokenError) throw err;
    if (err instanceof Error && err.name === "TimeoutError") {
      const capMs = init?.timeout ?? INSTAGRAM_DEFAULT_TIMEOUT_MS;
      throw new Error(
        `Instagram API timed out (>${capMs}ms). The service may be temporarily slow — please try again.`
      );
    }
    throw err;
  }
}

import { trace } from "@opentelemetry/api";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { OAuthTokenError } from "@/lib/oauth-token-lifecycle";
import { getProviderDef } from "@/lib/provider-registry";

// Meta error codes that indicate an expired or revoked access token
const META_TOKEN_ERROR_CODES = new Set([190, 102]);

type MetaGraphError = { error?: { code?: number; message?: string } };

const THREADS_DEFAULT_TIMEOUT_MS =
  getProviderDef("threads")?.transport?.timeoutMs ?? 8_000;

export async function threadsFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  try {
    const res = await serviceFetch(serviceConnectionId, path, {
      timeout: THREADS_DEFAULT_TIMEOUT_MS,
      ...init,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as MetaGraphError;
      const errorCode = body?.error?.code;
      const errorMessage = body?.error?.message ?? "Threads API request failed";
      trace.getActiveSpan()?.setAttribute("error.type", String(errorCode ?? res.status));
      if (errorCode !== undefined && META_TOKEN_ERROR_CODES.has(errorCode)) {
        throw new OAuthTokenError(
          `Threads token expired or revoked (code ${errorCode}): ${errorMessage}`
        );
      }
      throw new Error(`Threads API error (${res.status}) code=${errorCode}: ${errorMessage}`);
    }

    return res.json();
  } catch (err) {
    if (err instanceof OAuthTokenError) throw err;
    if (err instanceof Error && err.name === "TimeoutError") {
      const capMs = init?.timeout ?? THREADS_DEFAULT_TIMEOUT_MS;
      throw new Error(
        `Threads API timed out (>${capMs}ms). The service may be temporarily slow — please try again.`
      );
    }
    throw err;
  }
}

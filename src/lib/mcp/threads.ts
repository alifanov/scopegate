import { trace } from "@opentelemetry/api";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { OAuthTokenError } from "@/lib/oauth-token-lifecycle";

// Meta error codes that indicate an expired or revoked access token
const META_TOKEN_ERROR_CODES = new Set([190, 102]);

type MetaGraphError = { error?: { code?: number; message?: string } };

export async function threadsFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, {
    timeout: 8_000,
    ...init,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as MetaGraphError;
    const errorCode = body?.error?.code;
    const errorMessage = body?.error?.message ?? "Threads API request failed";
    // Annotate the active tool-execution span with error.type for SigNoz grouping
    trace.getActiveSpan()?.setAttribute("error.type", String(errorCode ?? res.status));
    if (errorCode !== undefined && META_TOKEN_ERROR_CODES.has(errorCode)) {
      throw new OAuthTokenError(
        `Threads token expired or revoked (code ${errorCode}): ${errorMessage}`
      );
    }
    throw new Error(`Threads API error (${res.status}) code=${errorCode}: ${errorMessage}`);
  }

  return res.json();
}

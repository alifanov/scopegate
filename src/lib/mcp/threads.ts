import { trace } from "@opentelemetry/api";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { OAuthTokenError } from "@/lib/oauth-token-lifecycle";

// Meta error codes that indicate an expired or revoked access token
const META_TOKEN_ERROR_CODES = new Set([190, 102]);

type MetaGraphError = { error?: { code?: number; message?: string } };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Transient connection errors worth retrying. Excludes TimeoutError: we already
// hit the per-request cap, retrying would just hit it again and waste the budget.
function isRetriableNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err instanceof OAuthTokenError) return false;
  if (err.name === "TimeoutError") return false;
  const code = (err as NodeJS.ErrnoException).code;
  return code === "ECONNRESET" || code === "ECONNREFUSED" || code === "ENOTFOUND";
}

const RETRY_DELAYS_MS = [250, 500];

export async function threadsFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await serviceFetch(serviceConnectionId, path, {
        timeout: 8_000,
        ...init,
      });

      // Retry on 5xx while attempts remain
      if (res.status >= 500 && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }

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
        const capMs = init?.timeout ?? 8_000;
        throw new Error(
          `Threads API timed out (>${capMs}ms). The service may be temporarily slow — please try again.`
        );
      }
      if (isRetriableNetworkError(err) && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw err;
    }
  }

  throw new Error("Threads API: retry exhausted");
}

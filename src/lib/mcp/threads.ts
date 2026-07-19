import type { ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { metaGraphFetch, MetaGraphApiError } from "@/lib/mcp/meta-graph";
import { OAuthTokenError } from "@/lib/oauth-token-lifecycle";
import { getProviderDef } from "@/lib/provider-registry";

// Threads still exposes the shared error class under its historical name so
// existing call sites (tools/threads.ts, its tests) keep working unchanged.
export { MetaGraphApiError as ThreadsApiError };

const THREADS_DEFAULT_TIMEOUT_MS =
  getProviderDef("threads")?.transport?.timeoutMs ?? 8_000;

export async function threadsFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  try {
    return await metaGraphFetch("threads", "Threads", serviceConnectionId, path, {
      timeout: THREADS_DEFAULT_TIMEOUT_MS,
      ...init,
    });
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

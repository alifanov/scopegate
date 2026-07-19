import type { ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { metaGraphFetch, MetaGraphApiError } from "@/lib/mcp/meta-graph";
import { OAuthTokenError } from "@/lib/oauth-token-lifecycle";
import { getProviderDef } from "@/lib/provider-registry";

export { MetaGraphApiError as InstagramApiError };

const INSTAGRAM_DEFAULT_TIMEOUT_MS =
  getProviderDef("instagram")?.transport?.timeoutMs ?? 8_000;

export async function instagramFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  try {
    return await metaGraphFetch("instagram", "Instagram", serviceConnectionId, path, {
      timeout: INSTAGRAM_DEFAULT_TIMEOUT_MS,
      ...init,
    });
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

import type { ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { metaGraphFetch, MetaGraphApiError } from "@/lib/mcp/meta-graph";

export { MetaGraphApiError as MetaAdsApiError };

export async function metaAdsFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  return metaGraphFetch("metaAds", "Meta Ads", serviceConnectionId, path, init);
}

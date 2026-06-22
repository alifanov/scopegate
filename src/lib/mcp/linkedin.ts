import { trace } from "@opentelemetry/api";
import { db } from "@/lib/db";
import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";
import { serviceFetch } from "@/lib/mcp/service-fetch";
import { safeFetch, type SafeFetchOptions } from "@/lib/mcp/safe-fetch";
import { getProviderDef } from "@/lib/provider-registry";
import { isRetriableNetworkError, retry as retryOperation } from "@/lib/mcp/retry";

const LINKEDIN_V2_BASE = "https://api.linkedin.com/v2";
export const LINKEDIN_VERSION = "202601";
const LINKEDIN_TRANSPORT = getProviderDef("linkedin")?.transport;
export const LINKEDIN_DEFAULT_TIMEOUT_MS = LINKEDIN_TRANSPORT?.timeoutMs ?? 1_400;
export const LINKEDIN_CREATE_POST_TIMEOUT_MS = 1_250;
const LINKEDIN_RETRY_DELAYS_MS = LINKEDIN_TRANSPORT?.retry?.delaysMs ?? [150, 300];
const LINKEDIN_FIXED_HEADERS = {
  "X-Restli-Protocol-Version": "2.0.0",
  "LinkedIn-Version": LINKEDIN_VERSION,
};

// Cache member URN per service connection
const memberUrnCache = new Map<string, string>();

export async function getLinkedInMemberUrn(
  serviceConnectionId: string
): Promise<string> {
  const cached = memberUrnCache.get(serviceConnectionId);
  if (cached) return cached;

  const connection = await db.serviceConnection.findUnique({
    where: { id: serviceConnectionId },
    select: { metadata: true },
  });
  const metadata = connection?.metadata as Record<string, unknown> | null | undefined;
  const metadataUrn = metadata?.linkedinMemberUrn;
  if (typeof metadataUrn === "string" && metadataUrn.startsWith("urn:li:person:")) {
    memberUrnCache.set(serviceConnectionId, metadataUrn);
    return metadataUrn;
  }

  const data = (await linkedinFetch(serviceConnectionId, "/userinfo", {
    useV2: true,
  })) as { sub: string };
  const urn = `urn:li:person:${data.sub}`;
  memberUrnCache.set(serviceConnectionId, urn);
  await db.serviceConnection.update({
    where: { id: serviceConnectionId },
    data: {
      metadata: {
        ...(metadata ?? {}),
        linkedinMemberUrn: urn,
      },
    },
  });
  return urn;
}

type LinkedInFetchOptions = Omit<SafeFetchOptions, "headers"> & {
  useV2?: boolean;
  headers?: Record<string, string>;
  retry?: boolean;
};

function recordLinkedInAttempts(attempts: number): void {
  trace.getActiveSpan()?.setAttribute("mcp.tool.attempts", attempts);
}

export async function linkedinFetch(
  serviceConnectionId: string,
  path: string,
  init?: LinkedInFetchOptions
): Promise<unknown> {
  const { useV2, retry: retryOverride, ...restInit } = init ?? {};
  const method = (restInit.method ?? "GET").toUpperCase();
  const shouldRetry = retryOverride ?? method === "GET";

  try {
    const res = useV2
      ? await retryOperation(
          async () => {
            const accessToken = await getValidAccessToken(serviceConnectionId);
            return safeFetch(`${LINKEDIN_V2_BASE}${path}`, {
              timeout: LINKEDIN_DEFAULT_TIMEOUT_MS,
              ...restInit,
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                ...LINKEDIN_FIXED_HEADERS,
                ...restInit.headers,
              },
            });
          },
          {
            delaysMs: shouldRetry ? LINKEDIN_RETRY_DELAYS_MS : [],
            onAttempt: recordLinkedInAttempts,
            shouldRetryResult: (response) => response.status >= 500,
            shouldRetryError: shouldRetry ? isRetriableNetworkError : () => false,
          }
        )
      : await serviceFetch(serviceConnectionId, path, {
          timeout: LINKEDIN_DEFAULT_TIMEOUT_MS,
          retry: shouldRetry,
          onAttempt: recordLinkedInAttempts,
          ...restInit,
        });

    if (!res.ok) {
      console.error(`[ScopeGate] LinkedIn API error (${res.status})`);
      throw new Error("LinkedIn API request failed");
    }

    if (res.status === 204 || res.status === 201) {
      const id = res.headers.get("x-restli-id");
      return { success: true, ...(id ? { id } : {}) };
    }

    const text = await res.text();
    if (!text) return { success: true };
    return JSON.parse(text);
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      const capMs = restInit.timeout ?? LINKEDIN_DEFAULT_TIMEOUT_MS;
      throw new Error(
        `LinkedIn API timed out (>${capMs}ms). The service may be temporarily slow - please try again.`
      );
    }
    throw err;
  }
}

export async function linkedinUploadImage(
  serviceConnectionId: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const authorUrn = await getLinkedInMemberUrn(serviceConnectionId);

  // Step 1: Initialize upload via standard REST transport
  const initRes = await serviceFetch(
    serviceConnectionId,
    "/images?action=initializeUpload",
    {
      method: "POST",
      body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
    }
  );

  if (!initRes.ok) {
    throw new Error("LinkedIn image upload init failed");
  }

  const initData = (await initRes.json()) as {
    value?: { uploadUrl?: string; image?: string };
  };

  const uploadUrl = initData.value?.uploadUrl;
  const imageUrn = initData.value?.image;
  if (!uploadUrl || !imageUrn) {
    throw new Error("LinkedIn image upload init did not return uploadUrl or image URN");
  }

  // Step 2: Upload binary image to the provider-returned URL (SSRF-safe)
  const accessToken = await getValidAccessToken(serviceConnectionId);
  const uploadRes = await safeFetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
    },
    body: new Uint8Array(imageBuffer),
  });

  if (!uploadRes.ok) {
    throw new Error("LinkedIn image binary upload failed");
  }

  return imageUrn;
}

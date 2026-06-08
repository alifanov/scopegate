import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";
import { serviceFetch } from "@/lib/mcp/service-fetch";
import { safeFetch } from "@/lib/mcp/safe-fetch";

const LINKEDIN_V2_BASE = "https://api.linkedin.com/v2";
const LINKEDIN_VERSION = "202601";
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

  const data = (await linkedinFetch(serviceConnectionId, "/userinfo", {
    useV2: true,
  })) as { sub: string };
  const urn = `urn:li:person:${data.sub}`;
  memberUrnCache.set(serviceConnectionId, urn);
  return urn;
}

export async function linkedinFetch(
  serviceConnectionId: string,
  path: string,
  init?: { useV2?: boolean; method?: string; body?: string; headers?: Record<string, string> }
): Promise<unknown> {
  const { useV2, ...restInit } = init ?? {};

  let res: Response;
  if (useV2) {
    // V2 uses a different base URL — route through safeFetch with manual auth
    const accessToken = await getValidAccessToken(serviceConnectionId);
    res = await safeFetch(`${LINKEDIN_V2_BASE}${path}`, {
      ...restInit,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...LINKEDIN_FIXED_HEADERS,
        ...restInit.headers,
      },
    });
  } else {
    res = await serviceFetch(serviceConnectionId, path, restInit);
  }

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

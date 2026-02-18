import { getValidAccessToken } from "@/lib/google-oauth";
import { db } from "@/lib/db";

const GOOGLE_ADS_API_VERSION = "v23";
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

function getDeveloperToken(): string {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!token) {
    throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN environment variable is required");
  }
  return token;
}

export async function getGoogleAdsCustomerId(
  serviceConnectionId: string
): Promise<string> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });

  const metadata = connection.metadata as Record<string, unknown> | null;
  if (metadata?.googleAdsCustomerId) {
    return metadata.googleAdsCustomerId as string;
  }

  // Discover customer ID via listAccessibleCustomers
  const accessToken = await getValidAccessToken(serviceConnectionId);
  const res = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers:listAccessibleCustomers`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": getDeveloperToken(),
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Google Ads listAccessibleCustomers error (${res.status}):`, text);
    throw new Error(`Failed to list accessible Google Ads customers (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { resourceNames: string[] };
  if (!data.resourceNames || data.resourceNames.length === 0) {
    throw new Error("No accessible Google Ads accounts found");
  }

  // resourceNames are like "customers/1234567890"
  const customerId = data.resourceNames[0].split("/")[1];

  // Store for future use
  await db.serviceConnection.update({
    where: { id: serviceConnectionId },
    data: {
      metadata: {
        ...(metadata ?? {}),
        googleAdsCustomerId: customerId,
      },
    },
  });

  return customerId;
}

export async function googleAdsQuery(
  serviceConnectionId: string,
  gaqlQuery: string
): Promise<unknown> {
  const [accessToken, customerId] = await Promise.all([
    getValidAccessToken(serviceConnectionId),
    getGoogleAdsCustomerId(serviceConnectionId),
  ]);

  const res = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": getDeveloperToken(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: gaqlQuery }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Google Ads query error (${res.status}):`, text);
    throw new Error(`Google Ads API query failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  // searchStream returns array of batches; flatten results
  if (Array.isArray(data)) {
    const results: unknown[] = [];
    for (const batch of data) {
      if (batch.results) {
        results.push(...batch.results);
      }
    }
    return results;
  }

  return data;
}

export async function googleAdsMutate(
  serviceConnectionId: string,
  resource: string,
  operations: unknown[]
): Promise<unknown> {
  const [accessToken, customerId] = await Promise.all([
    getValidAccessToken(serviceConnectionId),
    getGoogleAdsCustomerId(serviceConnectionId),
  ]);

  const res = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/${resource}:mutate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": getDeveloperToken(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ operations }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Google Ads mutate error (${res.status}):`, text);
    throw new Error(`Google Ads API mutate failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function googleAdsApplyRecommendation(
  serviceConnectionId: string,
  operations: unknown[]
): Promise<unknown> {
  const [accessToken, customerId] = await Promise.all([
    getValidAccessToken(serviceConnectionId),
    getGoogleAdsCustomerId(serviceConnectionId),
  ]);

  const res = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/recommendations:apply`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": getDeveloperToken(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ operations }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Google Ads apply recommendation error (${res.status}):`, text);
    throw new Error(`Google Ads API apply recommendation failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function googleAdsDismissRecommendation(
  serviceConnectionId: string,
  operations: unknown[]
): Promise<unknown> {
  const [accessToken, customerId] = await Promise.all([
    getValidAccessToken(serviceConnectionId),
    getGoogleAdsCustomerId(serviceConnectionId),
  ]);

  const res = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/recommendations:dismiss`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": getDeveloperToken(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ operations }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Google Ads dismiss recommendation error (${res.status}):`, text);
    throw new Error(`Google Ads API dismiss recommendation failed (${res.status}): ${text}`);
  }

  return res.json();
}

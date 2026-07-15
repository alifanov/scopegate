import { serviceFetch } from "@/lib/mcp/service-fetch";
import { db } from "@/lib/db";

const PENDING_ACCOUNT_EMAIL_RE = /#pending:[^#]+$/;

// A googleAds connection is inserted under a temp-unique accountEmail (see
// oauth-callback-config.ts) until its Google Ads customerId is known; this recovers the
// real account identity for dedupe lookups before that finalization happens.
export function stripPendingAccountEmail(accountEmail: string): string {
  return accountEmail.replace(PENDING_ACCOUNT_EMAIL_RE, "");
}

// A single Google login manages many Ads customer accounts, so the login email alone isn't a
// unique connection identity — the customerId is. Encode it into accountEmail (the same way
// hubspot/slack embed their sub-account ids) so (projectId, provider, accountEmail) stays a
// correct natural key and distinct Ads accounts under one login don't collide.
export function googleAdsAccountEmail(email: string, customerId: string): string {
  return `${stripPendingAccountEmail(email)} (${customerId})`;
}

type GoogleAdsCustomer = { id: string; name: string; isManager: boolean };

// listAccessibleCustomers resource names look like "customers/1234567890"; pull the id out.
export function extractCustomerIds(resourceNames: string[]): string[] {
  return resourceNames.map((r) => r.split("/")[1]);
}

type CustomerCheckSearchStreamBatch = Array<{
  results?: Array<{
    customer?: {
      descriptiveName?: string;
      status?: string;
      manager?: boolean;
    };
  }>;
}>;

// A candidate customer id is only real once its status-check searchStream batch confirms
// it's ENABLED — Google Ads returns a resource name for every account the token *could*
// reach, including disabled/removed ones the caller shouldn't see.
export function parseCustomerCheckResult(
  id: string,
  checkData: CustomerCheckSearchStreamBatch
): GoogleAdsCustomer | null {
  const customer = checkData?.[0]?.results?.[0]?.customer;
  if (!customer || customer.status !== "ENABLED") return null;

  return {
    id,
    name: customer.descriptiveName || id,
    isManager: customer.manager ?? false,
  };
}

export async function listAccessibleCustomers(
  serviceConnectionId: string
): Promise<GoogleAdsCustomer[]> {
  const res = await serviceFetch(serviceConnectionId, "/customers:listAccessibleCustomers");

  if (!res.ok) {
    console.error(`[ScopeGate] Google Ads listAccessibleCustomers error (${res.status})`);
    throw new Error("Failed to list accessible Google Ads customers");
  }

  const data = (await res.json()) as { resourceNames: string[] };
  if (!data.resourceNames || data.resourceNames.length === 0) {
    return [];
  }

  const candidateIds = extractCustomerIds(data.resourceNames);

  const results = await Promise.allSettled(
    candidateIds.map(async (id) => {
      const checkRes = await serviceFetch(
        serviceConnectionId,
        `/customers/${id}/googleAds:searchStream`,
        {
          method: "POST",
          body: JSON.stringify({
            query:
              "SELECT customer.id, customer.descriptive_name, customer.status, customer.manager FROM customer LIMIT 1",
          }),
        }
      );

      if (!checkRes.ok) return null;

      const checkData = (await checkRes.json()) as CustomerCheckSearchStreamBatch;
      return parseCustomerCheckResult(id, checkData);
    })
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<GoogleAdsCustomer | null> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value)
    .filter((v): v is GoogleAdsCustomer => v !== null);
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

  const customers = await listAccessibleCustomers(serviceConnectionId);

  if (customers.length === 0) {
    throw new Error("No accessible Google Ads accounts found");
  }

  // Prefer non-manager account, fall back to first available
  const customerId =
    customers.find((c) => !c.isManager)?.id ?? customers[0].id;

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

// searchStream paginates by returning an array of batches, each with its own `results`
// page; flatten them into one list so callers don't have to know about batching.
export function flattenSearchStreamResults(data: unknown): unknown {
  if (!Array.isArray(data)) return data;

  const results: unknown[] = [];
  for (const batch of data) {
    if (batch.results) {
      results.push(...batch.results);
    }
  }
  return results;
}

export async function googleAdsQuery(
  serviceConnectionId: string,
  gaqlQuery: string
): Promise<unknown> {
  const customerId = await getGoogleAdsCustomerId(serviceConnectionId);

  const res = await serviceFetch(
    serviceConnectionId,
    `/customers/${customerId}/googleAds:searchStream`,
    { method: "POST", body: JSON.stringify({ query: gaqlQuery }) }
  );

  if (!res.ok) {
    console.error(`[ScopeGate] Google Ads query error (${res.status})`);
    throw new Error("Google Ads API query failed");
  }

  return flattenSearchStreamResults(await res.json());
}

export async function googleAdsMutate(
  serviceConnectionId: string,
  resource: string,
  operations: unknown[]
): Promise<unknown> {
  const customerId = await getGoogleAdsCustomerId(serviceConnectionId);

  const res = await serviceFetch(
    serviceConnectionId,
    `/customers/${customerId}/${resource}:mutate`,
    { method: "POST", body: JSON.stringify({ operations }) }
  );

  if (!res.ok) {
    console.error(`[ScopeGate] Google Ads mutate error (${res.status})`);
    throw new Error("Google Ads API mutate failed");
  }

  return res.json();
}

export async function googleAdsApplyRecommendation(
  serviceConnectionId: string,
  operations: unknown[]
): Promise<unknown> {
  const customerId = await getGoogleAdsCustomerId(serviceConnectionId);

  const res = await serviceFetch(
    serviceConnectionId,
    `/customers/${customerId}/recommendations:apply`,
    { method: "POST", body: JSON.stringify({ operations }) }
  );

  if (!res.ok) {
    console.error(`[ScopeGate] Google Ads apply recommendation error (${res.status})`);
    throw new Error("Google Ads API apply recommendation failed");
  }

  return res.json();
}

export async function googleAdsDismissRecommendation(
  serviceConnectionId: string,
  operations: unknown[]
): Promise<unknown> {
  const customerId = await getGoogleAdsCustomerId(serviceConnectionId);

  const res = await serviceFetch(
    serviceConnectionId,
    `/customers/${customerId}/recommendations:dismiss`,
    { method: "POST", body: JSON.stringify({ operations }) }
  );

  if (!res.ok) {
    console.error(`[ScopeGate] Google Ads dismiss recommendation error (${res.status})`);
    throw new Error("Google Ads API dismiss recommendation failed");
  }

  return res.json();
}

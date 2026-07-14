import { serviceFetch } from "@/lib/mcp/service-fetch";
import { db } from "@/lib/db";

const PENDING_ACCOUNT_EMAIL_RE = /#pending:[^#]+$/;

// A googleAds connection is inserted under a temp-unique accountEmail (see
// oauth-callback-config.ts) until its Google Ads customerId is known; this recovers the
// real account identity for dedupe lookups before that finalization happens.
export function stripPendingAccountEmail(accountEmail: string): string {
  return accountEmail.replace(PENDING_ACCOUNT_EMAIL_RE, "");
}

export async function listAccessibleCustomers(
  serviceConnectionId: string
): Promise<Array<{ id: string; name: string; isManager: boolean }>> {
  const res = await serviceFetch(serviceConnectionId, "/customers:listAccessibleCustomers");

  if (!res.ok) {
    console.error(`[ScopeGate] Google Ads listAccessibleCustomers error (${res.status})`);
    throw new Error("Failed to list accessible Google Ads customers");
  }

  const data = (await res.json()) as { resourceNames: string[] };
  if (!data.resourceNames || data.resourceNames.length === 0) {
    return [];
  }

  const candidateIds = data.resourceNames.map((r) => r.split("/")[1]);

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

      const checkData = (await checkRes.json()) as Array<{
        results?: Array<{
          customer?: {
            descriptiveName?: string;
            status?: string;
            manager?: boolean;
          };
        }>;
      }>;

      const customer = checkData?.[0]?.results?.[0]?.customer;
      if (!customer || customer.status !== "ENABLED") return null;

      return {
        id,
        name: customer.descriptiveName || id,
        isManager: customer.manager ?? false,
      };
    })
  );

  return results
    .filter(
      (
        r
      ): r is PromiseFulfilledResult<{
        id: string;
        name: string;
        isManager: boolean;
      } | null> => r.status === "fulfilled"
    )
    .map((r) => r.value)
    .filter(
      (v): v is { id: string; name: string; isManager: boolean } => v !== null
    );
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

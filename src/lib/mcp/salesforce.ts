import { getValidSalesforceAccessToken } from "@/lib/salesforce-oauth";

export async function salesforceFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const { accessToken, instanceUrl } =
    await getValidSalesforceAccessToken(serviceConnectionId);

  if (!instanceUrl) {
    throw new Error(
      "Salesforce instance URL not found in service connection metadata"
    );
  }

  const res = await fetch(`${instanceUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    console.error(`[ScopeGate] Salesforce API error (${res.status})`);
    throw new Error("Salesforce API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}

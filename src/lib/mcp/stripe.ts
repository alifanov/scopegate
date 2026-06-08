import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function stripeFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions & { formData?: Record<string, string> }
): Promise<unknown> {
  const { formData, ...restInit } = init ?? {};

  const overrides: ServiceFetchOptions = { ...restInit };
  if (formData) {
    overrides.headers = {
      ...restInit.headers,
      "Content-Type": "application/x-www-form-urlencoded",
    };
    overrides.body = new URLSearchParams(formData).toString();
  }

  const res = await serviceFetch(serviceConnectionId, path, overrides);

  if (!res.ok) {
    console.error(`[ScopeGate] Stripe API error (${res.status})`);
    throw new Error("Stripe API request failed");
  }

  return res.json();
}

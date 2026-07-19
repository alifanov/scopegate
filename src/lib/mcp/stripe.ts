import { serviceJsonFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export function stripeFetch(
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

  return serviceJsonFetch(serviceConnectionId, path, overrides);
}

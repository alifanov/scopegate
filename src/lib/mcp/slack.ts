import { serviceFetch } from "@/lib/mcp/service-fetch";

export async function slackFetch(
  serviceConnectionId: string,
  method: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, `/${method}`, {
    method: "POST",
    body: params ? JSON.stringify(params) : undefined,
  });

  if (!res.ok) {
    console.error(`[ScopeGate] Slack API error (${res.status})`);
    throw new Error("Slack API request failed");
  }

  const data = (await res.json()) as {
    ok: boolean;
    error?: string;
    [key: string]: unknown;
  };
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }
  return data;
}

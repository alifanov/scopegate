import { getValidSlackAccessToken } from "@/lib/slack-oauth";

const SLACK_API_BASE = "https://slack.com/api";

export async function slackFetch(
  serviceConnectionId: string,
  method: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  const accessToken = await getValidSlackAccessToken(serviceConnectionId);

  const res = await fetch(`${SLACK_API_BASE}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: params ? JSON.stringify(params) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Slack API error (${res.status}):`, text);
    throw new Error(`Slack API request failed (${res.status}): ${text}`);
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

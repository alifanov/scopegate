import { db } from "@/lib/db";
import { getValidJiraAccessToken } from "@/lib/jira-oauth";

export async function jiraFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });

  const metadata = connection.metadata as Record<string, string> | null;
  const cloudId = metadata?.jiraCloudId;
  if (!cloudId) {
    throw new Error("Jira cloud ID not found in service connection metadata");
  }

  const accessToken = await getValidJiraAccessToken(serviceConnectionId);

  const res = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudId}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Jira API error (${res.status}):`, text);
    throw new Error(`Jira API request failed (${res.status}): ${text}`);
  }

  if (res.status === 204) return { success: true };
  return res.json();
}

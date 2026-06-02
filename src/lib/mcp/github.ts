import { getValidGitHubAccessToken } from "@/lib/github-oauth";

const GITHUB_API_BASE = "https://api.github.com";

export async function githubFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidGitHubAccessToken(serviceConnectionId);

  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    console.error(`[ScopeGate] GitHub API error (${res.status})`);
    throw new Error("GitHub API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}

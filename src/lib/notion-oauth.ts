import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID!;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET!;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/notion/callback`;
}

export function buildNotionAuthUrl(
  projectId: string,
  csrfToken: string
): string {
  const state = btoa(
    JSON.stringify({ projectId, provider: "notion", csrfToken })
  );
  const params = new URLSearchParams({
    client_id: NOTION_CLIENT_ID,
    response_type: "code",
    owner: "user",
    redirect_uri: getRedirectUri(),
    state,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

export async function exchangeNotionCodeForTokens(code: string) {
  const credentials = btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`);
  const res = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] Notion token exchange failed:", text);
    throw new Error(`Notion token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    workspace_id: string;
    workspace_name: string;
    bot_id: string;
    owner: {
      type: string;
      user?: {
        id: string;
        name?: string;
        person?: { email?: string };
      };
    };
  }>;
}

export async function getValidNotionAccessToken(
  serviceConnectionId: string
): Promise<string> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  // Notion integration tokens don't expire
  return decrypt(connection.accessToken);
}

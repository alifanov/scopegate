import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";
import { safeFetch } from "@/lib/mcp/safe-fetch";

export async function telegramFetch(
  serviceConnectionId: string,
  method: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  // Telegram embeds the bot token in the URL path — cannot use standard Bearer auth
  const botToken = await getValidAccessToken(serviceConnectionId);

  const res = await safeFetch(
    `https://api.telegram.org/bot${botToken}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: params ? JSON.stringify(params) : undefined,
    }
  );

  if (!res.ok) {
    console.error(`[ScopeGate] Telegram API error (${res.status})`);
    throw new Error("Telegram API request failed");
  }

  const data = (await res.json()) as {
    ok: boolean;
    result: unknown;
    description?: string;
  };
  if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);
  return data.result;
}

import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

export async function telegramFetch(
  serviceConnectionId: string,
  method: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  const botToken = decrypt(connection.accessToken);

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: params ? JSON.stringify(params) : undefined,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Telegram API error (${res.status}):`, text);
    throw new Error(`Telegram API request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    ok: boolean;
    result: unknown;
    description?: string;
  };
  if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);
  return data.result;
}

import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export async function stripeFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit & { formData?: Record<string, string> }
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  const apiKey = decrypt(connection.accessToken);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };

  let body = init?.body;
  if (init?.formData) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(init.formData).toString();
  }

  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    ...init,
    body,
    headers: { ...headers, ...init?.headers },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Stripe API error (${res.status}):`, text);
    throw new Error(`Stripe API request failed (${res.status}): ${text}`);
  }

  return res.json();
}

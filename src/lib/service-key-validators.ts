export const API_KEY_PROVIDERS = [
  "openRouter",
  "telegram",
  "semrush",
  "ahrefs",
  "stripe",
  "airtable",
  "calendly",
] as const;
export type ApiKeyProvider = (typeof API_KEY_PROVIDERS)[number];

export function isApiKeyProvider(value: string): value is ApiKeyProvider {
  return API_KEY_PROVIDERS.includes(value as ApiKeyProvider);
}

export type ApiKeyValidation = { valid: boolean; label?: string };
export type ApiKeyValidator = (apiKey: string) => Promise<ApiKeyValidation>;

async function validateOpenRouterKey(apiKey: string): Promise<ApiKeyValidation> {
  const res = await fetch("https://openrouter.ai/api/v1/key", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return { valid: false };
  const data = (await res.json()) as { data?: { label?: string } };
  return { valid: true, label: data.data?.label };
}

async function validateTelegramKey(apiKey: string): Promise<ApiKeyValidation> {
  const res = await fetch(`https://api.telegram.org/bot${apiKey}/getMe`);
  if (!res.ok) return { valid: false };
  const data = (await res.json()) as {
    ok: boolean;
    result?: { username?: string; first_name?: string };
  };
  if (!data.ok) return { valid: false };
  return {
    valid: true,
    label: data.result?.username ? `@${data.result.username}` : data.result?.first_name,
  };
}

async function validateSemrushKey(apiKey: string): Promise<ApiKeyValidation> {
  const res = await fetch(
    `https://api.semrush.com/?type=domain_ranks&key=${encodeURIComponent(apiKey)}&export_columns=Dn&domain=example.com&database=us`
  );
  const text = await res.text();
  if (text.startsWith("ERROR")) return { valid: false };
  return { valid: true, label: "SEMrush API" };
}

async function validateAhrefsKey(apiKey: string): Promise<ApiKeyValidation> {
  const res = await fetch("https://api.ahrefs.com/v3/subscription-info", {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return { valid: false };
  return { valid: true, label: "Ahrefs API" };
}

async function validateStripeKey(apiKey: string): Promise<ApiKeyValidation> {
  const res = await fetch("https://api.stripe.com/v1/balance", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return { valid: false };
  return { valid: true, label: apiKey.startsWith("sk_live_") ? "Live" : "Test" };
}

async function validateAirtableKey(apiKey: string): Promise<ApiKeyValidation> {
  const res = await fetch("https://api.airtable.com/v0/meta/whoami", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return { valid: false };
  const data = (await res.json()) as { email?: string };
  return { valid: true, label: data.email };
}

async function validateCalendlyKey(apiKey: string): Promise<ApiKeyValidation> {
  const res = await fetch("https://api.calendly.com/users/me", {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });
  if (!res.ok) return { valid: false };
  const data = (await res.json()) as { resource?: { name?: string; email?: string } };
  return { valid: true, label: data.resource?.email || data.resource?.name };
}

export const SERVICE_KEY_VALIDATORS: Record<ApiKeyProvider, ApiKeyValidator> = {
  openRouter: validateOpenRouterKey,
  telegram: validateTelegramKey,
  semrush: validateSemrushKey,
  ahrefs: validateAhrefsKey,
  stripe: validateStripeKey,
  airtable: validateAirtableKey,
  calendly: validateCalendlyKey,
};

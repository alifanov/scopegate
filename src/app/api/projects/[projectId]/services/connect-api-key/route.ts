import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { encrypt } from "@/lib/crypto";

const API_KEY_PROVIDERS = ["openRouter", "telegram", "semrush", "ahrefs", "stripe", "airtable", "calendly"] as const;
type ApiKeyProvider = (typeof API_KEY_PROVIDERS)[number];

function isApiKeyProvider(value: string): value is ApiKeyProvider {
  return API_KEY_PROVIDERS.includes(value as ApiKeyProvider);
}

async function validateOpenRouterKey(
  apiKey: string
): Promise<{ valid: boolean; label?: string }> {
  const res = await fetch("https://openrouter.ai/api/v1/key", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return { valid: false };
  const data = (await res.json()) as { data?: { label?: string } };
  return { valid: true, label: data.data?.label };
}

async function validateTelegramKey(
  apiKey: string
): Promise<{ valid: boolean; label?: string }> {
  const res = await fetch(`https://api.telegram.org/bot${apiKey}/getMe`);
  if (!res.ok) return { valid: false };
  const data = (await res.json()) as {
    ok: boolean;
    result?: { username?: string; first_name?: string };
  };
  if (!data.ok) return { valid: false };
  return {
    valid: true,
    label: data.result?.username
      ? `@${data.result.username}`
      : data.result?.first_name,
  };
}

async function validateSemrushKey(
  apiKey: string
): Promise<{ valid: boolean; label?: string }> {
  const res = await fetch(
    `https://api.semrush.com/?type=domain_ranks&key=${encodeURIComponent(apiKey)}&export_columns=Dn&domain=example.com&database=us`
  );
  const text = await res.text();
  if (text.startsWith("ERROR")) return { valid: false };
  return { valid: true, label: "SEMrush API" };
}

async function validateAhrefsKey(
  apiKey: string
): Promise<{ valid: boolean; label?: string }> {
  const res = await fetch("https://api.ahrefs.com/v3/subscription-info", {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return { valid: false };
  return { valid: true, label: "Ahrefs API" };
}

async function validateStripeKey(
  apiKey: string
): Promise<{ valid: boolean; label?: string }> {
  const res = await fetch("https://api.stripe.com/v1/balance", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return { valid: false };
  return {
    valid: true,
    label: apiKey.startsWith("sk_live_") ? "Live" : "Test",
  };
}

async function validateAirtableKey(
  apiKey: string
): Promise<{ valid: boolean; label?: string }> {
  const res = await fetch("https://api.airtable.com/v0/meta/whoami", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return { valid: false };
  const data = (await res.json()) as { email?: string };
  return { valid: true, label: data.email };
}

async function validateCalendlyKey(
  apiKey: string
): Promise<{ valid: boolean; label?: string }> {
  const res = await fetch("https://api.calendly.com/users/me", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return { valid: false };
  const data = (await res.json()) as {
    resource?: { name?: string; email?: string };
  };
  return {
    valid: true,
    label: data.resource?.email || data.resource?.name,
  };
}

const SIMPLE_KEY_VALIDATORS: Record<
  string,
  (key: string) => Promise<{ valid: boolean; label?: string }>
> = {
  openRouter: validateOpenRouterKey,
  telegram: validateTelegramKey,
  semrush: validateSemrushKey,
  ahrefs: validateAhrefsKey,
  stripe: validateStripeKey,
  airtable: validateAirtableKey,
  calendly: validateCalendlyKey,
};

// POST /api/projects/[projectId]/services/connect-api-key
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, string | undefined>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { provider, label } = body;

  if (!provider) {
    return NextResponse.json(
      { error: "Missing provider" },
      { status: 400 }
    );
  }

  if (!isApiKeyProvider(provider)) {
    return NextResponse.json(
      { error: "Unsupported provider" },
      { status: 400 }
    );
  }

  const { apiKey } = body;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing apiKey" },
      { status: 400 }
    );
  }

  const validator = SIMPLE_KEY_VALIDATORS[provider];
  if (!validator) {
    return NextResponse.json(
      { error: "No validator for provider" },
      { status: 400 }
    );
  }

  const validation = await validator(apiKey);
  const encryptedValue = encrypt(apiKey);

  if (!validation.valid) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 422 }
    );
  }

  const accountEmail = label || validation.label || "API Key";

  // Upsert: update existing or create new
  const existing = await db.serviceConnection.findFirst({
    where: { projectId, provider },
  });

  if (existing) {
    await db.serviceConnection.update({
      where: { id: existing.id },
      data: {
        accessToken: encryptedValue,
        refreshToken: null,
        accountEmail,
        status: "active",
        lastError: null,
      },
    });
  } else {
    await db.serviceConnection.create({
      data: {
        projectId,
        provider,
        accountEmail,
        accessToken: encryptedValue,
        refreshToken: null,
      },
    });
  }

  return NextResponse.json({ success: true });
}

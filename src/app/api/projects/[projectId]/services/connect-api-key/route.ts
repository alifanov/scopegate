import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { encrypt } from "@/lib/crypto";

const API_KEY_PROVIDERS = ["openRouter"] as const;
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

  let body: { provider: string; apiKey: string; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { provider, apiKey, label } = body;

  if (!provider || !apiKey) {
    return NextResponse.json(
      { error: "Missing provider or apiKey" },
      { status: 400 }
    );
  }

  if (!isApiKeyProvider(provider)) {
    return NextResponse.json(
      { error: "Unsupported provider" },
      { status: 400 }
    );
  }

  // Validate API key
  const validation = await validateOpenRouterKey(apiKey);
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

  const encryptedApiKey = encrypt(apiKey);

  if (existing) {
    await db.serviceConnection.update({
      where: { id: existing.id },
      data: {
        accessToken: encryptedApiKey,
        refreshToken: null,
        accountEmail,
      },
    });
  } else {
    await db.serviceConnection.create({
      data: {
        projectId,
        provider,
        accountEmail,
        accessToken: encryptedApiKey,
        refreshToken: null,
      },
    });
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { encrypt } from "@/lib/crypto";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import type { TwitterOAuthCredentials } from "@/lib/mcp/twitter";

const API_KEY_PROVIDERS = ["openRouter", "twitter"] as const;
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

async function validateTwitterCredentials(
  credentials: TwitterOAuthCredentials
): Promise<{ valid: boolean; label?: string }> {
  const oauth = new OAuth({
    consumer: { key: credentials.apiKey, secret: credentials.apiSecret },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });

  const url = "https://api.x.com/2/users/me";
  const authorization = oauth.authorize(
    { url, method: "GET" },
    { key: credentials.accessToken, secret: credentials.accessTokenSecret }
  );
  const authHeader = oauth.toHeader(authorization).Authorization;

  const res = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) return { valid: false };

  const data = (await res.json()) as { data?: { username?: string } };
  return { valid: true, label: data.data?.username ? `@${data.data.username}` : undefined };
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

  let validation: { valid: boolean; label?: string };
  let encryptedValue: string;

  if (provider === "twitter") {
    const { twitterApiKey, twitterApiSecret, twitterAccessToken, twitterAccessTokenSecret } = body;
    if (!twitterApiKey || !twitterApiSecret || !twitterAccessToken || !twitterAccessTokenSecret) {
      return NextResponse.json(
        { error: "Missing Twitter OAuth credentials" },
        { status: 400 }
      );
    }
    const credentials: TwitterOAuthCredentials = {
      apiKey: twitterApiKey,
      apiSecret: twitterApiSecret,
      accessToken: twitterAccessToken,
      accessTokenSecret: twitterAccessTokenSecret,
    };
    validation = await validateTwitterCredentials(credentials);
    encryptedValue = encrypt(JSON.stringify(credentials));
  } else {
    const { apiKey } = body;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing apiKey" },
        { status: 400 }
      );
    }
    validation = await validateOpenRouterKey(apiKey);
    encryptedValue = encrypt(apiKey);
  }

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

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withProjectAuth } from "@/lib/project-access";
import { encrypt } from "@/lib/crypto";
import { isApiKeyProvider, SERVICE_KEY_VALIDATORS } from "@/lib/service-key-validators";

// POST /api/projects/[projectId]/services/connect-api-key
export const POST = withProjectAuth<{ projectId: string }>(
  "owner",
  async (request, { params: { projectId } }) => {
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

    const validator = SERVICE_KEY_VALIDATORS[provider];
    const validation = await validator(apiKey);
    const encryptedValue = encrypt(apiKey);

    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 422 }
      );
    }

    const accountEmail = label || validation.label || "API Key";

    await db.serviceConnection.upsert({
      where: { projectId_provider_accountEmail: { projectId, provider, accountEmail } },
      update: {
        accessToken: encryptedValue,
        refreshToken: null,
        status: "active",
        lastError: null,
      },
      create: {
        projectId,
        provider,
        accountEmail,
        accessToken: encryptedValue,
        refreshToken: null,
      },
    });

    return NextResponse.json({ success: true });
  }
);

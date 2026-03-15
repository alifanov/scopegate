import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { encrypt } from "@/lib/crypto";
import { validateEmailConnection } from "@/lib/mcp/email";

// POST /api/projects/[projectId]/services/connect-email
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    email,
    password,
    imapHost,
    imapPort,
    smtpHost,
    smtpPort,
    imapSecure,
    smtpSecure,
  } = body as {
    email?: string;
    password?: string;
    imapHost?: string;
    imapPort?: number;
    smtpHost?: string;
    smtpPort?: number;
    imapSecure?: boolean;
    smtpSecure?: boolean;
  };

  if (!email || !password || !imapHost || !smtpHost) {
    return NextResponse.json(
      { error: "Missing required fields: email, password, imapHost, smtpHost" },
      { status: 400 }
    );
  }

  // Validate connection
  const validation = await validateEmailConnection({
    imapHost,
    imapPort: imapPort || 993,
    smtpHost,
    smtpPort: smtpPort || 465,
    username: email,
    password,
    imapSecure: imapSecure !== false,
    smtpSecure: smtpSecure !== false,
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error || "Connection failed" },
      { status: 422 }
    );
  }

  const encryptedPassword = encrypt(password);

  const metadata = {
    imapHost,
    imapPort: imapPort || 993,
    imapSecure: imapSecure !== false,
    smtpHost,
    smtpPort: smtpPort || 465,
    smtpSecure: smtpSecure !== false,
  };

  // Upsert: update existing or create new
  const existing = await db.serviceConnection.findFirst({
    where: { projectId, provider: "email", accountEmail: email },
  });

  if (existing) {
    await db.serviceConnection.update({
      where: { id: existing.id },
      data: {
        accessToken: encryptedPassword,
        refreshToken: null,
        accountEmail: email,
        metadata,
        status: "active",
        lastError: null,
      },
    });
  } else {
    await db.serviceConnection.create({
      data: {
        projectId,
        provider: "email",
        accountEmail: email,
        accessToken: encryptedPassword,
        refreshToken: null,
        metadata,
      },
    });
  }

  return NextResponse.json({ success: true });
}

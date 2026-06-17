import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { token, email, name, password } = body;

  if (!token || !email || !password) {
    return NextResponse.json(
      { error: "Token, email, and password are required" },
      { status: 400 }
    );
  }

  const invite = await db.inviteToken.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (invite.usedAt) {
    return NextResponse.json(
      { error: "This invite link has already been used" },
      { status: 400 }
    );
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invite link has expired" },
      { status: 400 }
    );
  }

  if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { error: "This invite is for a different email address" },
      { status: 400 }
    );
  }

  try {
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash with better-auth's own hasher so the credential is verifiable at
    // login. Better-auth ignores any custom hasher placed at the wrong config
    // level and falls back to scrypt, so we must use the same path it uses.
    const ctx = await auth.$context;
    const hashedPassword = await ctx.password.hash(password);

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || "",
        emailVerified: true,
      },
    });

    await db.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });

    await db.inviteToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

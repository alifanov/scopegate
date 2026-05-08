import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

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
    await auth.api.signUpEmail({
      headers: await headers(),
      body: { email, name: name || "", password },
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

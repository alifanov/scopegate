import { NextResponse } from "next/server";
import { acceptInvite, AcceptInviteError } from "@/lib/accept-invite";

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

  try {
    await acceptInvite({ token, email, name, password });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AcceptInviteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

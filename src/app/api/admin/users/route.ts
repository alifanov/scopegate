import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-middleware";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const body = await request.json();
  const { email, name, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        email,
        name: name || "",
        password,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

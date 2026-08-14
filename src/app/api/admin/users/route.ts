import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { createCredentialUser } from "@/lib/create-user";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export const GET = withAdminAuth(async () => {
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
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const { email, name, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  // `signUpEmail` is closed by `disableSignUp: true`, so the length check it
  // used to perform has to live here too.
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  try {
    await createCredentialUser(email, password, name || "");

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

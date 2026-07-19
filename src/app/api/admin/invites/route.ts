import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export const POST = withAdminAuth(async (request) => {
  const body = await request.json().catch(() => ({}));
  const { email } = body;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.inviteToken.create({
    data: { token, email: email || null, expiresAt },
  });

  const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "";
  const inviteUrl = `${baseUrl}/invite/${token}`;

  return NextResponse.json({ inviteUrl, expiresAt });
});

export const GET = withAdminAuth(async () => {
  const invites = await db.inviteToken.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ invites });
});

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { isAdmin } from "./admin";

export async function getCurrentUser(): Promise<{
  userId: string;
  email: string;
} | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return null;
  return { userId: session.user.id, email: session.user.email };
}

export async function requireAdmin(): Promise<
  { userId: string; email: string } | NextResponse
> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

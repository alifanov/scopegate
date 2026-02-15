import { headers } from "next/headers";
import { auth } from "./auth";

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

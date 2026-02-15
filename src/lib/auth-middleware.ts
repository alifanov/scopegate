import { cookies } from "next/headers";
import { verifyJwt, type JwtPayload } from "./auth";

export async function getCurrentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyJwt(token);
}

import crypto from "node:crypto";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Creates an email+password user directly.
 *
 * `auth.api.signUpEmail` is permanently closed by `disableSignUp: true` in
 * auth.ts (open password signup is a spam vector), so every internal path that
 * legitimately creates a credential user — the admin bootstrap on first boot,
 * the admin "create user" endpoint, accept-invite — has to write `user` +
 * `account` itself. The password MUST be hashed via `auth.$context.password.hash`
 * so the stored hash matches better-auth's own verify path on sign-in.
 */
export async function createCredentialUser(
  email: string,
  password: string,
  name = ""
) {
  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(password);

  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: email.toLowerCase(), name, emailVerified: true },
    });

    await tx.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });

    return user;
  });
}

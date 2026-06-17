import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    // Password hashing/verification uses better-auth's built-in scrypt.
    // A custom hasher would have to go under `emailAndPassword.password.hash`
    // / `.verify` — placing it elsewhere is silently ignored. Any code that
    // creates credentials directly (e.g. accept-invite) MUST hash via
    // `auth.$context.password.hash` so the stored hash matches this path.
  },
  plugins: [nextCookies()],
});

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    async hashPassword(password: string) {
      return bcrypt.hash(password, 12);
    },
    async verifyPassword({ password, hash }: { password: string; hash: string }) {
      return bcrypt.compare(password, hash);
    },
  },
  plugins: [nextCookies()],
});

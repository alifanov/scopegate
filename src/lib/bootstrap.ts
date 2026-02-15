import { db } from "./db";
import { hashPassword } from "./auth";

export async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "[ScopeGate] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin bootstrap"
    );
    return;
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await hashPassword(password);
  await db.user.create({
    data: { email, passwordHash, name: "Admin" },
  });

  console.log(`[ScopeGate] Admin user created: ${email}`);
}

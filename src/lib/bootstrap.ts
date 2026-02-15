import { db } from "./db";
import { auth } from "./auth";

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

  await auth.api.signUpEmail({
    body: { email, password, name: "Admin" },
  });

  console.log(`[ScopeGate] Admin user created: ${email}`);
}

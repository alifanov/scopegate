export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: string };

export function checkCronAuth(
  request: Request,
  secret = process.env.CRON_SECRET
): CronAuthResult {
  if (!secret) {
    return { ok: false, status: 500, error: "CRON_SECRET not configured" };
  }

  const authHeader = request.headers
    .get("authorization")
    ?.replace(/\s+/g, " ")
    .trim();
  const expected = `Bearer ${secret.trim()}`;
  if (authHeader !== expected) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}

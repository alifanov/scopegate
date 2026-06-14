import { randomBytes } from "crypto";

const API_KEY_PREFIX = "sg_";
const API_KEY_BYTES = 32;
const INVALID_KEY_WINDOW_MS = 60_000;
const INVALID_KEY_LIMIT = 30;

type InvalidKeyBucket = {
  count: number;
  resetAt: number;
};

const invalidKeyBuckets = new Map<string, InvalidKeyBucket>();

export function generateMcpApiKey(): string {
  return `${API_KEY_PREFIX}${randomBytes(API_KEY_BYTES).toString("base64url")}`;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export function isInvalidMcpApiKeyRateLimited(ip: string, now = Date.now()): boolean {
  const existing = invalidKeyBuckets.get(ip);

  if (!existing || existing.resetAt <= now) {
    invalidKeyBuckets.set(ip, { count: 1, resetAt: now + INVALID_KEY_WINDOW_MS });
    return false;
  }

  existing.count += 1;
  return existing.count > INVALID_KEY_LIMIT;
}

export function isInvalidMcpApiKeyBlocked(ip: string, now = Date.now()): boolean {
  const bucket = invalidKeyBuckets.get(ip);
  return Boolean(
    bucket && bucket.resetAt > now && bucket.count >= INVALID_KEY_LIMIT
  );
}

export function getInvalidMcpApiKeyRetryAfterSeconds(
  ip: string,
  now = Date.now()
): number {
  const bucket = invalidKeyBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) return 0;
  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

export function resetInvalidMcpApiKeyRateLimitsForTest(): void {
  invalidKeyBuckets.clear();
}

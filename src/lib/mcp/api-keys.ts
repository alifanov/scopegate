import { randomBytes } from "crypto";

const API_KEY_PREFIX = "sg_";
const API_KEY_BYTES = 32;
const INVALID_KEY_WINDOW_MS = 60_000;
const INVALID_KEY_LIMIT = 30;
// ponytail: hard cap so a burst of unique IPs can't grow the Map without bound
const INVALID_KEY_BUCKET_MAX = 20_000;

type InvalidKeyBucket = {
  count: number;
  resetAt: number;
};

const invalidKeyBuckets = new Map<string, InvalidKeyBucket>();

export function generateMcpApiKey(): string {
  return `${API_KEY_PREFIX}${randomBytes(API_KEY_BYTES).toString("base64url")}`;
}

export function getClientIp(request: Request): string {
  // Traefik sets x-real-ip itself and appends the real peer as the LAST hop of
  // x-forwarded-for — everything before that is client-supplied and spoofable.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    const lastIp = hops[hops.length - 1];
    if (lastIp) return lastIp;
  }

  return request.headers.get("cf-connecting-ip")?.trim() || "unknown";
}

// ponytail: Map insertion order tracks creation time, and every bucket's
// resetAt is creation time + a fixed window, so the oldest-inserted entries
// are also the earliest to expire — pruning from the front is enough, no
// separate expiry index needed.
function pruneInvalidKeyBuckets(now: number): void {
  for (const [key, bucket] of invalidKeyBuckets) {
    if (bucket.resetAt > now) break;
    invalidKeyBuckets.delete(key);
  }

  while (invalidKeyBuckets.size > INVALID_KEY_BUCKET_MAX) {
    const oldestKey = invalidKeyBuckets.keys().next().value;
    if (oldestKey === undefined) break;
    invalidKeyBuckets.delete(oldestKey);
  }
}

export function isInvalidMcpApiKeyRateLimited(ip: string, now = Date.now()): boolean {
  const existing = invalidKeyBuckets.get(ip);

  if (!existing || existing.resetAt <= now) {
    invalidKeyBuckets.delete(ip); // re-set below to move it to the end (most recent)
    invalidKeyBuckets.set(ip, { count: 1, resetAt: now + INVALID_KEY_WINDOW_MS });
    pruneInvalidKeyBuckets(now);
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

export function getInvalidMcpApiKeyBucketCountForTest(): number {
  return invalidKeyBuckets.size;
}

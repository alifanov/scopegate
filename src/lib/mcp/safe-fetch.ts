import { lookup } from "dns/promises";

const MAX_REDIRECTS = 5;

// IPv4 private/reserved ranges
const PRIVATE_IPV4: RegExp[] = [
  /^0\./,                                       // 0.0.0.0/8 — this-network
  /^10\./,                                      // 10.0.0.0/8
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // 100.64.0.0/10 — CGNAT
  /^127\./,                                     // 127.0.0.0/8 — loopback
  /^169\.254\./,                                // 169.254.0.0/16 — link-local / AWS metadata
  /^172\.(1[6-9]|2\d|3[01])\./,               // 172.16.0.0/12
  /^192\.168\./,                                // 192.168.0.0/16
  /^198\.1[89]\./,                              // 198.18.0.0/15 — benchmarking
  /^2(2[4-9]|[3-5]\d)\./,                      // 224.0.0.0/3 — multicast + reserved
];

// IPv6 private/reserved ranges
const PRIVATE_IPV6: RegExp[] = [
  /^::1$/i,    // loopback
  /^::$/,      // unspecified
  /^fe[89ab]/i, // fe80::/10 — link-local
  /^f[cd]/i,   // fc00::/7 — unique local
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IPV4.some((r) => r.test(ip)) || PRIVATE_IPV6.some((r) => r.test(ip));
}

async function assertSafeUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("SSRF protection: invalid URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error(
      `SSRF protection: only https: scheme is allowed (got "${parsed.protocol}")`
    );
  }

  // Strip IPv6 brackets: [::1] → ::1
  const host = parsed.hostname.replace(/^\[|\]$/g, "");

  // Block bare IP literals in private ranges without a DNS round-trip
  if (isPrivateIp(host)) {
    throw new Error(`SSRF protection: IP address "${host}" is in a reserved range`);
  }

  // Resolve hostname to catch private-IP-backed hostnames (localhost, internal.corp, etc.)
  try {
    const { address } = await lookup(host, { family: 0 });
    if (isPrivateIp(address)) {
      throw new Error(
        `SSRF protection: host "${host}" resolves to reserved IP "${address}"`
      );
    }
  } catch (e) {
    if ((e as Error).message?.startsWith("SSRF protection")) throw e;
    throw new Error(`SSRF protection: DNS resolution failed for "${host}"`);
  }
}

/**
 * SSRF-safe replacement for fetch(). Only allows https:, blocks private/reserved
 * IP ranges (both direct and via DNS), and re-validates every redirect hop.
 */
export async function safeFetch(
  url: string,
  options?: RequestInit,
  _depth = 0
): Promise<Response> {
  if (_depth > MAX_REDIRECTS) {
    throw new Error(`SSRF protection: too many redirects (max ${MAX_REDIRECTS})`);
  }

  await assertSafeUrl(url);

  const res = await fetch(url, { ...options, redirect: "manual" });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) {
      throw new Error("Redirect response missing Location header");
    }
    return safeFetch(new URL(location, url).toString(), options, _depth + 1);
  }

  return res;
}

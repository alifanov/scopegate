import { lookup as dnsLookup } from "dns/promises";
import type { LookupOptions } from "node:dns";
import https from "node:https";

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

// Resolves hostname → checks ALL returned A/AAAA records → throws if any is private.
// Returns the first safe {address, family} to use for pinned connection.
async function resolveAllAndValidate(host: string): Promise<{ address: string; family: number }> {
  let records: { address: string; family: number }[];
  try {
    records = await dnsLookup(host, { all: true });
  } catch (e) {
    if ((e as Error).message?.startsWith("SSRF protection")) throw e;
    throw new Error(`SSRF protection: DNS resolution failed for "${host}"`);
  }
  if (!records.length) {
    throw new Error(`SSRF protection: DNS returned no results for "${host}"`);
  }
  for (const { address } of records) {
    if (isPrivateIp(address)) {
      throw new Error(
        `SSRF protection: host "${host}" resolves to reserved IP "${address}"`
      );
    }
  }
  return records[0];
}

// Validates URL scheme and host. Returns parsed URL + the IP to pin the connection to.
// The pinned IP is used in the custom lookup so the TCP connection goes to the
// already-validated address instead of re-resolving the hostname (prevents DNS rebinding).
async function assertSafeUrl(
  rawUrl: string
): Promise<{ parsed: URL; pinnedIp: string; pinnedFamily: number }> {
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

  // Block bare IP literals in private ranges immediately (no DNS round-trip needed)
  if (isPrivateIp(host)) {
    throw new Error(`SSRF protection: IP address "${host}" is in a reserved range`);
  }

  // If it's already a public IP literal, use it directly as the pinned address
  const isIpv4Literal = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isIpv6Literal = host.includes(":");
  if (isIpv4Literal || isIpv6Literal) {
    return { parsed, pinnedIp: host, pinnedFamily: isIpv6Literal ? 6 : 4 };
  }

  // Resolve hostname — validates ALL A/AAAA records, not just the first
  const { address, family } = await resolveAllAndValidate(host);
  return { parsed, pinnedIp: address, pinnedFamily: family };
}

function headersToRecord(h: RequestInit["headers"]): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(h)) return Object.fromEntries(h) as Record<string, string>;
  return h as Record<string, string>;
}

// Makes the HTTPS request, connecting to `pinnedIp` while keeping the original
// hostname for the `Host` header and TLS SNI (Node uses `hostname` option for SNI).
// The custom `lookup` callback always returns the pre-validated IP so undici/Node
// cannot re-resolve the hostname and be tricked by DNS rebinding.
function makeRequest(
  parsed: URL,
  options: SafeFetchOptions | undefined,
  pinnedIp: string,
  pinnedFamily: number
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const port = parsed.port ? Number(parsed.port) : 443;
    const method = (options?.method as string | undefined) ?? "GET";
    const timeoutMs = options?.timeout;

    const req = https.request(
      {
        hostname: parsed.hostname, // used for SNI in TLS handshake
        port,
        path: parsed.pathname + (parsed.search ?? ""),
        method,
        headers: headersToRecord(options?.headers),
        // Pin DNS: always return the already-validated IP, blocking any re-resolution
        lookup: (
          _hostname: string,
          _opts: LookupOptions,
          callback: (
            err: NodeJS.ErrnoException | null,
            address: string,
            family: number
          ) => void
        ) => {
          callback(null, pinnedIp, pinnedFamily);
        },
      },
      (res) => {
        const headers = new Headers();
        for (const [k, v] of Object.entries(res.headers)) {
          if (typeof v === "string") headers.set(k, v);
          else if (Array.isArray(v)) v.forEach((item) => headers.append(k, item));
        }
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            res.on("data", (chunk: Buffer) =>
              controller.enqueue(new Uint8Array(chunk))
            );
            res.on("end", () => controller.close());
            res.on("error", (err: Error) => controller.error(err));
          },
        });
        resolve(
          new Response(stream, {
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            headers,
          })
        );
      }
    );

    req.on("error", reject);

    if (timeoutMs) {
      req.setTimeout(timeoutMs, () => {
        const err = new Error(`Request timed out after ${timeoutMs}ms`);
        err.name = "TimeoutError";
        req.destroy(err);
      });
    }

    const body = options?.body;
    if (typeof body === "string") req.write(body);
    else if (body instanceof Uint8Array || Buffer.isBuffer(body)) req.write(body);

    req.end();
  });
}

export type SafeFetchOptions = RequestInit & { timeout?: number };

/**
 * SSRF-safe HTTPS fetch. Resolves all DNS records (A + AAAA) and blocks requests
 * if any resolves to a private/reserved range. Pins the TCP connection to the
 * validated IP to prevent DNS-rebinding TOCTOU attacks. Re-validates on every
 * redirect hop.
 *
 * Pass `timeout` (ms) to abort the request if the server doesn't respond in time.
 */
export async function safeFetch(
  url: string,
  options?: SafeFetchOptions,
  _depth = 0
): Promise<Response> {
  if (_depth > MAX_REDIRECTS) {
    throw new Error(`SSRF protection: too many redirects (max ${MAX_REDIRECTS})`);
  }

  const { parsed, pinnedIp, pinnedFamily } = await assertSafeUrl(url);
  const res = await makeRequest(parsed, options, pinnedIp, pinnedFamily);

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) {
      throw new Error("Redirect response missing Location header");
    }
    return safeFetch(new URL(location, url).toString(), options, _depth + 1);
  }

  return res;
}

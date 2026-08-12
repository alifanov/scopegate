import { resolveSafeIp } from "./safe-fetch";
import { AuthError } from "@/lib/auth-middleware";

const IMAP_PORTS = new Set([143, 993]);
const SMTP_PORTS = new Set([25, 465, 587]);

export class MailConnectionError extends AuthError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Resolves and validates a mail server host/port before ImapFlow/nodemailer opens
// a socket to it — this transport bypasses safeFetch entirely (different stack,
// different protocol), so it needs the same SSRF check applied independently.
// Returns the pinned IP to connect to plus the original host to use as TLS SNI
// servername, mirroring safeFetch's DNS-rebinding-safe pinning.
export async function resolveMailTarget(
  host: string,
  port: number,
  kind: "imap" | "smtp"
): Promise<{ host: string; servername: string; port: number }> {
  const allowlist = kind === "imap" ? IMAP_PORTS : SMTP_PORTS;
  if (!allowlist.has(port)) {
    throw new MailConnectionError(
      `Port ${port} is not allowed for ${kind.toUpperCase()} (allowed: ${[...allowlist].join(", ")})`
    );
  }

  const { address } = await resolveSafeIp(host);
  return { host: address, servername: host, port };
}

import { createHmac, timingSafeEqual } from "crypto";

export interface OAuthStatePayload {
  projectId: string;
  provider: string;
  csrfToken: string;
}

function getHmacKey(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required for OAuth state signing");
  return secret;
}

export function buildSignedState(payload: OAuthStatePayload): string {
  const encoded = btoa(JSON.stringify(payload));
  const sig = createHmac("sha256", getHmacKey()).update(encoded).digest("hex");
  return `${encoded}.${sig}`;
}

export function parseAndVerifyState(stateParam: string): OAuthStatePayload {
  const dotIndex = stateParam.lastIndexOf(".");
  if (dotIndex === -1) throw new Error("Invalid state: missing signature");

  const encoded = stateParam.slice(0, dotIndex);
  const sig = stateParam.slice(dotIndex + 1);

  const expectedSig = createHmac("sha256", getHmacKey()).update(encoded).digest("hex");
  const sigBuf = Buffer.from(sig.length === expectedSig.length ? sig : "", "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error("State HMAC verification failed");
  }

  return JSON.parse(atob(encoded)) as OAuthStatePayload;
}

export function parseCookieValue(cookieHeader: string, name: string): string | undefined {
  const prefix = `${name}=`;
  const entry = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  return entry?.substring(prefix.length);
}

const SENSITIVE_FIELDS = new Set([
  "body",
  "content",
  "message",
  "text",
  "html",
  "subject",
  "caption",
  "password",
  "secret",
  "token",
  "key",
  "code",
  "credential",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "private_key",
  "privatekey",
]);

export function redactParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (SENSITIVE_FIELDS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out[k] = redactParams(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function sanitizeAuditError(err: string, maxLength = 500): string {
  return err.length > maxLength ? `${err.slice(0, maxLength)}…` : err;
}

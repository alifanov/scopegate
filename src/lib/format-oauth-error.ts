// Turns the raw error strings stored in `ServiceConnection.lastError` (full
// provider HTTP responses, e.g. `Gmail token refresh failed (400): {
// "error": "invalid_grant", "error_description": "..." }`) into a short,
// human-readable reason for display — instead of dumping the raw JSON/body.
export function formatOAuthErrorReason(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Meta/Threads shape: "... code=190: Error validating access token: <reason>"
  const metaMatch = raw.match(/code=(\d+):\s*(.+)$/);
  if (metaMatch) {
    return `code=${metaMatch[1]} — ${metaMatch[2].trim()}`;
  }

  // Standard OAuth2 token-endpoint body: { "error": "...", "error_description": "..." }
  const jsonStart = raw.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart));
      const code = parsed.error ?? parsed.error_code;
      const desc = parsed.error_description ?? parsed.message;
      if (code) return desc ? `${code} — ${desc}` : String(code);
    } catch {
      // Not JSON — fall through to the raw-string fallback below.
    }
  }

  return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
}

// Google's OAuth consent screen in "Testing" status issues refresh tokens
// that expire after 7 days — the recurring symptom is `invalid_grant` on a
// weekly cadence with no other cause. Surface the fix (publish the consent
// screen) instead of leaving the user to rediscover it via support.
export function isGoogleTestingModeError(reason: string | null): boolean {
  return reason !== null && reason.startsWith("invalid_grant");
}

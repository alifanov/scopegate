import { describe, it, expect } from "vitest";
import { formatOAuthErrorReason, isGoogleTestingModeError } from "@/lib/format-oauth-error";

describe("formatOAuthErrorReason", () => {
  it("returns null for empty input", () => {
    expect(formatOAuthErrorReason(null)).toBeNull();
    expect(formatOAuthErrorReason(undefined)).toBeNull();
    expect(formatOAuthErrorReason("")).toBeNull();
  });

  it("extracts error + description from a standard OAuth2 token error body", () => {
    const raw = `Gmail token refresh failed (400): { "error": "invalid_grant", "error_description": "Token has been expired or revoked." }`;
    expect(formatOAuthErrorReason(raw)).toBe(
      "invalid_grant — Token has been expired or revoked."
    );
  });

  it("extracts code + message from a Meta Graph API error", () => {
    const raw =
      "Meta token exchange failed (400) code=190: Error validating access token: Session has expired on Saturday, 30-May-26";
    expect(formatOAuthErrorReason(raw)).toBe(
      "code=190 — Error validating access token: Session has expired on Saturday, 30-May-26"
    );
  });

  it("falls back to the raw string when nothing matches", () => {
    expect(formatOAuthErrorReason("network timeout")).toBe("network timeout");
  });

  it("truncates very long raw fallback strings", () => {
    const raw = "x".repeat(200);
    const result = formatOAuthErrorReason(raw)!;
    expect(result.length).toBeLessThanOrEqual(141);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("isGoogleTestingModeError", () => {
  it("flags invalid_grant reasons", () => {
    expect(isGoogleTestingModeError("invalid_grant — Token has been expired or revoked.")).toBe(true);
  });

  it("ignores other reasons", () => {
    expect(isGoogleTestingModeError("code=190 — Error validating access token")).toBe(false);
    expect(isGoogleTestingModeError(null)).toBe(false);
  });
});

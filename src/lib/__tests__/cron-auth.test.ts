import { describe, expect, it } from "vitest";
import { checkCronAuth } from "../cron-auth";

function makeRequest(authorization?: string) {
  return new Request("http://localhost/api/cron/refresh-tokens", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });
}

describe("checkCronAuth", () => {
  it("returns 500 when no secret is configured", () => {
    const result = checkCronAuth(makeRequest("Bearer anything"), undefined);
    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "CRON_SECRET not configured",
    });
  });

  it("returns 401 when the Authorization header is missing", () => {
    const result = checkCronAuth(makeRequest(), "s3cret");
    expect(result).toEqual({ ok: false, status: 401, error: "Unauthorized" });
  });

  it("returns 401 when the bearer token does not match", () => {
    const result = checkCronAuth(makeRequest("Bearer wrong"), "s3cret");
    expect(result).toEqual({ ok: false, status: 401, error: "Unauthorized" });
  });

  it("returns ok for a matching bearer token", () => {
    const result = checkCronAuth(makeRequest("Bearer s3cret"), "s3cret");
    expect(result).toEqual({ ok: true });
  });

  it("tolerates surrounding whitespace in the header and secret", () => {
    const result = checkCronAuth(makeRequest("Bearer  s3cret "), " s3cret ");
    expect(result).toEqual({ ok: true });
  });
});

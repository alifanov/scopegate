import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

function makeRequest(ip: string, body: unknown): Request {
  return new Request("http://localhost/api/csp-report", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/csp-report", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("accepts a report-uri body", async () => {
    const response = await POST(
      makeRequest("198.51.100.1", {
        "csp-report": { "blocked-uri": "https://evil.example", "violated-directive": "script-src" },
      }) as never,
    );

    expect(response.status).toBe(204);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("accepts a report-to body", async () => {
    const response = await POST(
      makeRequest("198.51.100.2", [
        { type: "csp-violation", body: { blockedURL: "https://evil.example", effectiveDirective: "script-src" } },
      ]) as never,
    );

    expect(response.status).toBe(204);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("drops an oversized body without emitting telemetry", async () => {
    const response = await POST(
      makeRequest("198.51.100.3", {
        "csp-report": { "blocked-uri": "x".repeat(70_000) },
      }) as never,
    );

    expect(response.status).toBe(204);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("caps report-to arrays at 10 entries per request", async () => {
    const reports = Array.from({ length: 1000 }, () => ({
      type: "csp-violation",
      body: { blockedURL: "x" },
    }));

    const response = await POST(makeRequest("198.51.100.4", reports) as never);

    expect(response.status).toBe(204);
    expect(warnSpy).toHaveBeenCalledTimes(10);
  });

  it("rate limits repeated requests from the same IP", async () => {
    const ip = "198.51.100.5";
    for (let i = 0; i < 31; i += 1) {
      await POST(makeRequest(ip, { "csp-report": { "blocked-uri": "https://evil.example" } }) as never);
    }

    expect(warnSpy).toHaveBeenCalledTimes(30);
  });
});

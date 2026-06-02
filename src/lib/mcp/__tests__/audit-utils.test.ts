import { describe, it, expect } from "vitest";
import { redactParams, sanitizeAuditError } from "../audit-utils";

describe("redactParams", () => {
  it("redacts known sensitive fields", () => {
    const result = redactParams({
      to: "user@example.com",
      subject: "Hello",
      body: "Secret email content",
      message: "Private message",
      html: "<p>Body</p>",
    });

    expect(result.to).toBe("user@example.com");
    expect(result.subject).toBe("[REDACTED]");
    expect(result.body).toBe("[REDACTED]");
    expect(result.message).toBe("[REDACTED]");
    expect(result.html).toBe("[REDACTED]");
  });

  it("redacts credential fields", () => {
    const result = redactParams({
      endpoint: "/api/data",
      token: "secret-token",
      api_key: "key-12345",
      password: "hunter2",
    });

    expect(result.endpoint).toBe("/api/data");
    expect(result.token).toBe("[REDACTED]");
    expect(result.api_key).toBe("[REDACTED]");
    expect(result.password).toBe("[REDACTED]");
  });

  it("is case-insensitive for field names", () => {
    const result = redactParams({
      Body: "content",
      BODY: "content",
      body: "content",
    });

    expect(result.Body).toBe("[REDACTED]");
    expect(result.BODY).toBe("[REDACTED]");
    expect(result.body).toBe("[REDACTED]");
  });

  it("recursively redacts nested objects", () => {
    const result = redactParams({
      metadata: {
        author: "Alice",
        token: "nested-secret",
      },
    });

    expect((result.metadata as Record<string, unknown>).author).toBe("Alice");
    expect((result.metadata as Record<string, unknown>).token).toBe("[REDACTED]");
  });

  it("preserves non-sensitive fields unchanged", () => {
    const result = redactParams({
      limit: 10,
      query: "SELECT * FROM accounts",
      customerId: "cust-123",
    });

    expect(result.limit).toBe(10);
    expect(result.query).toBe("SELECT * FROM accounts");
    expect(result.customerId).toBe("cust-123");
  });

  it("does not redact arrays", () => {
    const result = redactParams({
      ids: ["a", "b", "c"],
    });

    expect(result.ids).toEqual(["a", "b", "c"]);
  });
});

describe("sanitizeAuditError", () => {
  it("returns short errors unchanged", () => {
    expect(sanitizeAuditError("Token refresh failed")).toBe("Token refresh failed");
  });

  it("truncates errors exceeding maxLength", () => {
    const long = "x".repeat(600);
    const result = sanitizeAuditError(long);

    expect(result.length).toBeLessThan(600);
    expect(result).toContain("…");
  });

  it("respects custom maxLength", () => {
    const result = sanitizeAuditError("abcdef", 3);

    expect(result).toBe("abc…");
  });
});

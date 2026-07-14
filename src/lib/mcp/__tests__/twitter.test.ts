import { describe, expect, it } from "vitest";
import { extractTwitterError } from "@/lib/mcp/twitter";

describe("extractTwitterError", () => {
  it("joins messages from an errors[] array, preferring detail over message", () => {
    const body = {
      errors: [{ detail: "Duplicate tweet" }, { message: "fallback message" }],
    };
    expect(extractTwitterError(body)).toBe("Duplicate tweet; fallback message");
  });

  it("falls back to message when detail is absent in an errors[] entry", () => {
    const body = { errors: [{ message: "Rate limit exceeded" }] };
    expect(extractTwitterError(body)).toBe("Rate limit exceeded");
  });

  it("falls back to top-level detail/title when there is no errors[] array", () => {
    expect(extractTwitterError({ detail: "Not authorized" })).toBe("Not authorized");
    expect(extractTwitterError({ title: "Forbidden" })).toBe("Forbidden");
    expect(extractTwitterError({ detail: "Not authorized", title: "Forbidden" })).toBe(
      "Not authorized"
    );
  });

  it("returns undefined for an empty errors[] array, falling back to title/detail", () => {
    expect(extractTwitterError({ errors: [], title: "Forbidden" })).toBe("Forbidden");
  });

  it("returns undefined when body is missing or not an object", () => {
    expect(extractTwitterError(undefined)).toBeUndefined();
    expect(extractTwitterError(null)).toBeUndefined();
    expect(extractTwitterError("plain text error")).toBeUndefined();
  });

  it("returns undefined when body has none of the known error fields", () => {
    expect(extractTwitterError({ foo: "bar" })).toBeUndefined();
  });
});

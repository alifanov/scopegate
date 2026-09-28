import { describe, expect, it } from "vitest";
import { safeErrorDetail } from "../handler";
import { MetaGraphApiError } from "../meta-graph";

describe("safeErrorDetail", () => {
  it("surfaces an upstream Meta rejection verbatim", () => {
    const err = new MetaGraphApiError(
      "Threads API error (400) code=24: The requested resource does not exist",
      400,
      24
    );
    expect(safeErrorDetail(err)).toBe(
      "Error: Threads API error (400) code=24: The requested resource does not exist"
    );
  });

  it("marks timeouts as possibly-completed without leaking the raw message", () => {
    expect(safeErrorDetail(new Error("Threads API timed out (>3500ms)."))).toMatch(
      /timed out.*verify before retrying/
    );
  });

  it("hides anything else", () => {
    expect(safeErrorDetail(new Error("PrismaClientKnownRequestError: db at 10.0.0.5"))).toBe(
      "Error: Tool execution failed"
    );
  });
});

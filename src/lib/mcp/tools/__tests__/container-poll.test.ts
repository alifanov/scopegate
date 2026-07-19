import { describe, expect, it } from "vitest";
import {
  classifyContainerStatus,
  computeStepTimeout,
  shouldStopPolling,
  waitForContainerReady,
} from "../container-poll";

describe("computeStepTimeout", () => {
  it("uses the preferred timeout when plenty of budget remains", () => {
    expect(computeStepTimeout(4_500, /* deadline */ 20_000, /* now */ 0, /* reserve */ 3_500)).toBe(4_500);
  });

  it("caps to the remaining budget minus the reserve when that is smaller", () => {
    // deadline - now - reserve = 10_000 - 8_000 - 1_000 = 1_000 < preferred
    expect(computeStepTimeout(4_500, 10_000, 8_000, 1_000)).toBe(1_000);
  });

  it("floors at minMs even when the budget is already exhausted", () => {
    expect(computeStepTimeout(4_500, 10_000, 9_900, 1_000)).toBe(1_000);
    expect(computeStepTimeout(4_500, 5_000, 20_000, 1_000, 500)).toBe(500);
  });

  it("respects a custom minMs floor", () => {
    expect(computeStepTimeout(4_500, 10_000, 9_999, 1_000, 250)).toBe(250);
  });
});

describe("shouldStopPolling", () => {
  it("returns false when another interval fits before the deadline", () => {
    expect(shouldStopPolling(0, 10_000, 1_000)).toBe(false);
  });

  it("returns true once the next interval would reach or pass the deadline", () => {
    expect(shouldStopPolling(9_000, 10_000, 1_000)).toBe(true);
    expect(shouldStopPolling(9_500, 10_000, 1_000)).toBe(true);
  });
});

describe("classifyContainerStatus", () => {
  it("classifies FINISHED as ready", () => {
    expect(classifyContainerStatus({ status: "FINISHED" }, "Threads")).toEqual({ kind: "ready" });
  });

  it("classifies IN_PROGRESS (and undefined) as pending", () => {
    expect(classifyContainerStatus({ status: "IN_PROGRESS" }, "Threads")).toEqual({ kind: "pending" });
    expect(classifyContainerStatus({ status: undefined }, "Threads")).toEqual({ kind: "pending" });
  });

  it("classifies ERROR/EXPIRED as failed with a descriptive message using the given label", () => {
    expect(classifyContainerStatus({ status: "ERROR", errorMessage: "bad format" }, "Threads")).toEqual({
      kind: "failed",
      message: "Threads media processing error: bad format",
    });
    expect(classifyContainerStatus({ status: "EXPIRED" }, "Instagram")).toEqual({
      kind: "failed",
      message: "Instagram media processing expired: unknown error",
    });
  });
});

describe("waitForContainerReady", () => {
  it("returns true as soon as fetchStatus reports ready", async () => {
    const fetchStatus = async () => ({ kind: "ready" as const });
    await expect(waitForContainerReady(Date.now() + 10_000, 1_000, fetchStatus)).resolves.toBe(true);
  });

  it("throws when fetchStatus reports failed", async () => {
    const fetchStatus = async () => ({ kind: "failed" as const, message: "boom" });
    await expect(waitForContainerReady(Date.now() + 10_000, 1_000, fetchStatus)).rejects.toThrow("boom");
  });

  it("returns false once the deadline has already passed without ever polling", async () => {
    let calls = 0;
    const fetchStatus = async () => {
      calls++;
      return { kind: "pending" as const };
    };
    await expect(waitForContainerReady(Date.now() - 1, 1_000, fetchStatus)).resolves.toBe(false);
    expect(calls).toBe(0);
  });
});

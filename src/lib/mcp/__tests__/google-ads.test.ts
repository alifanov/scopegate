import { describe, expect, it } from "vitest";
import {
  extractCustomerIds,
  flattenSearchStreamResults,
  googleAdsAccountEmail,
  parseCustomerCheckResult,
  stripPendingAccountEmail,
} from "@/lib/mcp/google-ads";

describe("extractCustomerIds", () => {
  it("pulls the numeric id out of each resource name", () => {
    expect(
      extractCustomerIds(["customers/1234567890", "customers/9876543210"])
    ).toEqual(["1234567890", "9876543210"]);
  });

  it("returns an empty array for an empty input", () => {
    expect(extractCustomerIds([])).toEqual([]);
  });
});

describe("parseCustomerCheckResult", () => {
  it("returns the customer when status is ENABLED", () => {
    const checkData = [
      { results: [{ customer: { descriptiveName: "Acme Co", status: "ENABLED", manager: false } }] },
    ];
    expect(parseCustomerCheckResult("123", checkData)).toEqual({
      id: "123",
      name: "Acme Co",
      isManager: false,
    });
  });

  it("falls back to the id when descriptiveName is missing", () => {
    const checkData = [{ results: [{ customer: { status: "ENABLED" } }] }];
    expect(parseCustomerCheckResult("123", checkData)).toEqual({
      id: "123",
      name: "123",
      isManager: false,
    });
  });

  it("defaults isManager to false when absent", () => {
    const checkData = [{ results: [{ customer: { status: "ENABLED", descriptiveName: "X" } }] }];
    expect(parseCustomerCheckResult("1", checkData)?.isManager).toBe(false);
  });

  it("returns null when status is not ENABLED", () => {
    const checkData = [{ results: [{ customer: { status: "SUSPENDED" } }] }];
    expect(parseCustomerCheckResult("123", checkData)).toBeNull();
  });

  it("returns null when the batch has no customer at all", () => {
    expect(parseCustomerCheckResult("123", [])).toBeNull();
    expect(parseCustomerCheckResult("123", [{ results: [] }])).toBeNull();
    expect(parseCustomerCheckResult("123", [{}])).toBeNull();
  });
});

describe("flattenSearchStreamResults", () => {
  it("flattens results across multiple batches", () => {
    const data = [
      { results: [{ a: 1 }, { a: 2 }] },
      { results: [{ a: 3 }] },
    ];
    expect(flattenSearchStreamResults(data)).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it("skips batches without a results field", () => {
    const data = [{ results: [{ a: 1 }] }, {}];
    expect(flattenSearchStreamResults(data)).toEqual([{ a: 1 }]);
  });

  it("returns an empty array for an all-empty batch list", () => {
    expect(flattenSearchStreamResults([])).toEqual([]);
  });

  it("passes non-array data through unchanged", () => {
    const data = { some: "object" };
    expect(flattenSearchStreamResults(data)).toBe(data);
  });
});

describe("stripPendingAccountEmail", () => {
  it("strips the #pending: suffix used before the customerId is known", () => {
    expect(stripPendingAccountEmail("user@example.com#pending:abc123")).toBe(
      "user@example.com"
    );
  });

  it("leaves a finalized accountEmail unchanged", () => {
    expect(stripPendingAccountEmail("user@example.com")).toBe("user@example.com");
  });
});

describe("googleAdsAccountEmail", () => {
  it("appends the customerId so distinct Ads accounts under one login stay unique", () => {
    expect(googleAdsAccountEmail("user@example.com", "5437477721")).toBe(
      "user@example.com (5437477721)"
    );
    expect(googleAdsAccountEmail("user@example.com", "9339932590")).toBe(
      "user@example.com (9339932590)"
    );
  });

  it("strips a still-pending suffix before appending the customerId", () => {
    expect(googleAdsAccountEmail("user@example.com#pending:abc", "123")).toBe(
      "user@example.com (123)"
    );
  });
});

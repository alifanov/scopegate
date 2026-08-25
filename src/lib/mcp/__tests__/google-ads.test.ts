import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mcp/service-fetch", () => ({
  serviceFetch: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    serviceConnection: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        metadata: { googleAdsCustomerId: "1234567890" },
      }),
    },
  },
}));

import { serviceFetch } from "@/lib/mcp/service-fetch";
import {
  extractCustomerIds,
  flattenSearchStreamResults,
  googleAdsAccountEmail,
  googleAdsQuery,
  parseCustomerCheckResult,
  stripPendingAccountEmail,
} from "@/lib/mcp/google-ads";
import { googleAdsTools } from "@/lib/mcp/tools/google-ads";

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

describe("googleAdsQuery error reporting", () => {
  it("includes the GoogleAdsFailure detail message when present", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: "Request contains an invalid argument.",
            status: "INVALID_ARGUMENT",
            details: [
              {
                errors: [{ message: "The developer token is not approved for this account." }],
              },
            ],
          },
        }),
        { status: 403 }
      )
    );
    await expect(googleAdsQuery("conn-1", "SELECT customer.id FROM customer")).rejects.toThrow(
      "Google Ads API query failed (403) — The developer token is not approved for this account."
    );
  });

  it("falls back to error.message when no detail message is present", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "Invalid GAQL query." } }), {
        status: 400,
      })
    );
    await expect(googleAdsQuery("conn-1", "SELECT bad FROM customer")).rejects.toThrow(
      "Google Ads API query failed (400) — Invalid GAQL query."
    );
  });

  // searchStream is the shape every query tool actually hits: its error body is array-wrapped,
  // which used to leave a bare "query failed (400)" with no reason at all.
  it("unwraps the array envelope searchStream returns on error", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            error: {
              message: "Request contains an invalid argument.",
              details: [{ errors: [{ message: "Cannot select field 'asset.sitelink_asset'." }] }],
            },
          },
        ]),
        { status: 400 }
      )
    );
    await expect(googleAdsQuery("conn-1", "SELECT asset.sitelink_asset FROM asset")).rejects.toThrow(
      "Google Ads API query failed (400) — Cannot select field 'asset.sitelink_asset'."
    );
  });

  it("falls back to a generic message when the body isn't JSON", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(new Response("not json", { status: 500 }));
    await expect(googleAdsQuery("conn-1", "SELECT customer.id FROM customer")).rejects.toThrow(
      "Google Ads API query failed (500)"
    );
  });
});

describe("googleAds_update_conversion_action", () => {
  const tool = () =>
    googleAdsTools.find((t) => t.name === "googleAds_update_conversion_action")!;

  it("sends only the changed fields in the updateMask", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(new Response("{}", { status: 200 }));
    await tool().handler(
      { conversionActionId: "7539523572", name: "signup", category: "SIGNUP" },
      { serviceConnectionId: "conn-1" } as never
    );
    const [, path, opts] = vi.mocked(serviceFetch).mock.calls.at(-1)!;
    expect(path).toBe("/customers/1234567890/conversionActions:mutate");
    expect(JSON.parse(opts!.body as string)).toEqual({
      operations: [
        {
          update: {
            resourceName: "customers/1234567890/conversionActions/7539523572",
            name: "signup",
            category: "SIGNUP",
          },
          updateMask: "name,category",
        },
      ],
    });
  });

  it("refuses a no-op update", async () => {
    await expect(
      tool().handler({ conversionActionId: "7539523572" }, { serviceConnectionId: "conn-1" } as never)
    ).rejects.toThrow("No fields to update");
  });
});

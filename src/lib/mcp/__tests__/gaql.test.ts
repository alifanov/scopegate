import { describe, expect, it } from "vitest";
import { GaqlBuilder } from "@/lib/mcp/gaql";

describe("GaqlBuilder.toString", () => {
  const cases: Array<{ name: string; build: (b: GaqlBuilder) => GaqlBuilder; expected: string }> = [
    {
      name: "select with no conditions",
      build: (b) => b,
      expected: "SELECT campaign.id FROM campaign",
    },
    {
      name: "eqId appends a numeric equality condition",
      build: (b) => b.eqId("campaign.id", "123"),
      expected: "SELECT campaign.id FROM campaign WHERE campaign.id = 123",
    },
    {
      name: "eqId is skipped when the value is absent",
      build: (b) => b.eqId("campaign.id", undefined),
      expected: "SELECT campaign.id FROM campaign",
    },
    {
      name: "eqEnum appends a quoted enum condition",
      build: (b) => b.eqEnum("campaign.status", "ENABLED"),
      expected: "SELECT campaign.id FROM campaign WHERE campaign.status = 'ENABLED'",
    },
    {
      name: "containsId appends a LIKE condition",
      build: (b) => b.containsId("campaign_audience_view.resource_name", "42"),
      expected: "SELECT campaign.id FROM campaign WHERE campaign_audience_view.resource_name LIKE '%42%'",
    },
    {
      name: "resourceEq substitutes the {id} placeholder with a validated id",
      build: (b) => b.resourceEq("ad_group.campaign", "customers/999/campaigns/{id}", "123"),
      expected: "SELECT campaign.id FROM campaign WHERE ad_group.campaign = 'customers/999/campaigns/123'",
    },
    {
      name: "betweenDates appends a range condition when both dates are present",
      build: (b) => b.betweenDates("segments.date", "2026-01-01", "2026-01-31"),
      expected: "SELECT campaign.id FROM campaign WHERE segments.date >= '2026-01-01' AND segments.date <= '2026-01-31'",
    },
    {
      name: "betweenDates is skipped when only one date is present",
      build: (b) => b.betweenDates("segments.date", "2026-01-01", undefined),
      expected: "SELECT campaign.id FROM campaign",
    },
    {
      name: "dateRange falls back to LAST_30_DAYS when no date params are given",
      build: (b) => b.dateRange({}),
      expected: "SELECT campaign.id FROM campaign WHERE segments.date DURING LAST_30_DAYS",
    },
    {
      name: "dateRange uses a BETWEEN clause when start and end are given",
      build: (b) => b.dateRange({ dateRangeStart: "2026-01-01", dateRangeEnd: "2026-01-31" }),
      expected: "SELECT campaign.id FROM campaign WHERE segments.date BETWEEN '2026-01-01' AND '2026-01-31'",
    },
    {
      name: "dateRange uses a DURING clause when a preset is given",
      build: (b) => b.dateRange({ datePreset: "LAST_7_DAYS" }),
      expected: "SELECT campaign.id FROM campaign WHERE segments.date DURING LAST_7_DAYS",
    },
    {
      name: "orderBy and limit append their clauses in order",
      build: (b) => b.orderBy("campaign.id DESC").limit(10, 50),
      expected: "SELECT campaign.id FROM campaign ORDER BY campaign.id DESC LIMIT 10",
    },
    {
      name: "multiple where-family calls are AND-joined",
      build: (b) => b.eqId("campaign.id", "1").eqEnum("campaign.status", "PAUSED"),
      expected: "SELECT campaign.id FROM campaign WHERE campaign.id = 1 AND campaign.status = 'PAUSED'",
    },
  ];

  for (const { name, build, expected } of cases) {
    it(name, () => {
      expect(build(new GaqlBuilder(["campaign.id"], "campaign")).toString()).toBe(expected);
    });
  }
});

describe("GaqlBuilder injection resistance", () => {
  it("rejects a numeric id containing a single quote", () => {
    expect(() => new GaqlBuilder(["campaign.id"], "campaign").eqId("campaign.id", "1'")).toThrow();
  });

  it("rejects a numeric id containing a semicolon", () => {
    expect(() => new GaqlBuilder(["campaign.id"], "campaign").eqId("campaign.id", "1;DROP")).toThrow();
  });

  it("rejects a numeric id containing a newline", () => {
    expect(() => new GaqlBuilder(["campaign.id"], "campaign").eqId("campaign.id", "1\n2")).toThrow();
  });

  it("rejects an OR 1=1 style injection attempt in a numeric id", () => {
    expect(() => new GaqlBuilder(["campaign.id"], "campaign").eqId("campaign.id", "1 OR 1=1")).toThrow();
  });

  it("rejects an enum value containing a single quote", () => {
    expect(() => new GaqlBuilder(["campaign.id"], "campaign").eqEnum("campaign.status", "ENABLED' OR '1'='1")).toThrow();
  });

  it("rejects an enum value containing a semicolon", () => {
    expect(() => new GaqlBuilder(["campaign.id"], "campaign").eqEnum("campaign.status", "ENABLED;DROP TABLE")).toThrow();
  });

  it("rejects a lowercase enum value", () => {
    expect(() => new GaqlBuilder(["campaign.id"], "campaign").eqEnum("campaign.status", "enabled")).toThrow();
  });

  it("rejects resourceEq id containing a single quote that would close the string literal", () => {
    expect(() =>
      new GaqlBuilder(["campaign.id"], "campaign").resourceEq(
        "ad_group.campaign",
        "customers/1/campaigns/{id}",
        "1' OR '1'='1"
      )
    ).toThrow();
  });

  it("rejects containsId value containing a single quote", () => {
    expect(() => new GaqlBuilder(["campaign.id"], "campaign").containsId("x.resource_name", "1' OR '1'='1")).toThrow();
  });

  it("rejects a malformed date", () => {
    expect(() => new GaqlBuilder(["campaign.id"], "campaign").betweenDates("segments.date", "2026-01-01'; DROP--", "2026-01-31")).toThrow();
  });
});

describe("GaqlBuilder.limit clamping", () => {
  it("clamps a negative limit to the minimum of 1", () => {
    expect(new GaqlBuilder(["campaign.id"], "campaign").limit(-1, 50).toString()).toBe(
      "SELECT campaign.id FROM campaign LIMIT 1"
    );
  });

  it("clamps a zero limit to the minimum of 1", () => {
    expect(new GaqlBuilder(["campaign.id"], "campaign").limit(0, 50).toString()).toBe(
      "SELECT campaign.id FROM campaign LIMIT 1"
    );
  });

  it("clamps an absurdly large limit to the maximum of 10000", () => {
    expect(new GaqlBuilder(["campaign.id"], "campaign").limit(1e21, 50).toString()).toBe(
      "SELECT campaign.id FROM campaign LIMIT 10000"
    );
  });

  it("falls back to the provided default when limit is not a number", () => {
    expect(new GaqlBuilder(["campaign.id"], "campaign").limit(undefined, 50).toString()).toBe(
      "SELECT campaign.id FROM campaign LIMIT 50"
    );
  });

  it("truncates a fractional limit", () => {
    expect(new GaqlBuilder(["campaign.id"], "campaign").limit(10.9, 50).toString()).toBe(
      "SELECT campaign.id FROM campaign LIMIT 10"
    );
  });

  it("passes a normal in-range limit through unchanged", () => {
    expect(new GaqlBuilder(["campaign.id"], "campaign").limit(250, 50).toString()).toBe(
      "SELECT campaign.id FROM campaign LIMIT 250"
    );
  });
});

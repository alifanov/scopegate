import { describe, expect, it } from "vitest";
import { parseSemrushCsv } from "@/lib/mcp/semrush";

describe("parseSemrushCsv", () => {
  const cases: { name: string; input: string; expected: ReturnType<typeof parseSemrushCsv> }[] = [
    {
      name: "parses header + rows into objects keyed by header",
      input: "Dn;Rk;Or\nexample.com;1;42",
      expected: { data: [{ Dn: "example.com", Rk: "1", Or: "42" }] },
    },
    {
      name: "parses multiple rows",
      input: "Dn;Rk\na.com;1\nb.com;2",
      expected: {
        data: [
          { Dn: "a.com", Rk: "1" },
          { Dn: "b.com", Rk: "2" },
        ],
      },
    },
    {
      name: "fills missing trailing cells with empty string",
      input: "Dn;Rk;Or\na.com;1",
      expected: { data: [{ Dn: "a.com", Rk: "1", Or: "" }] },
    },
    {
      name: "returns empty data + raw text when only a header line is present",
      input: "Dn;Rk;Or",
      expected: { data: [], raw: "Dn;Rk;Or" },
    },
    {
      name: "returns empty data + raw text for an empty string",
      input: "",
      expected: { data: [], raw: "" },
    },
    {
      name: "trims surrounding whitespace/newlines before parsing",
      input: "\n  Dn;Rk\na.com;1\n\n",
      expected: { data: [{ Dn: "a.com", Rk: "1" }] },
    },
  ];

  for (const { name, input, expected } of cases) {
    it(name, () => {
      expect(parseSemrushCsv(input)).toEqual(expected);
    });
  }
});

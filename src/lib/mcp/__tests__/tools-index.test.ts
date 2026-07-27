import { describe, it, expect } from "vitest";
import { getToolsByActions } from "../tools";

describe("getToolsByActions provider scoping", () => {
  it("registers the tool when the action belongs to the given provider", () => {
    const tools = getToolsByActions(["gmail:read_emails"], "gmail");
    expect(tools.map((t) => t.action)).toContain("gmail:read_emails");
  });

  it("never registers a tool whose action belongs to a different provider, even if allowed", () => {
    const tools = getToolsByActions(["stripe:list_charges"], "gmail");
    expect(tools).toHaveLength(0);
  });
});

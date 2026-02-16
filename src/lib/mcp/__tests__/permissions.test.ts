import { describe, it, expect } from "vitest";
import { ALL_ACTIONS, getActionGroup, PERMISSION_GROUPS } from "../permissions";

describe("permissions – permission validation (Fix 4)", () => {
  it("ALL_ACTIONS contains known actions", () => {
    expect(ALL_ACTIONS).toContain("calendar:list_events");
    expect(ALL_ACTIONS).toContain("gmail:read_emails");
    expect(ALL_ACTIONS).toContain("drive:list_files");
    expect(ALL_ACTIONS).toContain("googleAds:list_campaigns");
    expect(ALL_ACTIONS).toContain("searchConsole:list_sites");
  });

  it("ALL_ACTIONS does not contain arbitrary strings", () => {
    expect(ALL_ACTIONS).not.toContain("foo:bar");
    expect(ALL_ACTIONS).not.toContain("unknown:action");
    expect(ALL_ACTIONS).not.toContain("");
  });

  it("every action in ALL_ACTIONS has a valid group via getActionGroup()", () => {
    const groupKeys = Object.keys(PERMISSION_GROUPS);
    for (const action of ALL_ACTIONS) {
      const group = getActionGroup(action);
      expect(group).not.toBeNull();
      expect(groupKeys).toContain(group);
    }
  });

  it("getActionGroup() returns null for unknown actions", () => {
    expect(getActionGroup("foo:bar")).toBeNull();
    expect(getActionGroup("")).toBeNull();
    expect(getActionGroup("calendar:nonexistent")).toBeNull();
  });

  it("filtering unknown actions works (route handler pattern)", () => {
    const requested = [
      "calendar:list_events",
      "foo:bar",
      "gmail:read_emails",
      "invalid:perm",
    ];
    const invalid = requested.filter((a) => !ALL_ACTIONS.includes(a));
    expect(invalid).toEqual(["foo:bar", "invalid:perm"]);

    const valid = requested.filter((a) => ALL_ACTIONS.includes(a));
    expect(valid).toEqual(["calendar:list_events", "gmail:read_emails"]);
  });
});

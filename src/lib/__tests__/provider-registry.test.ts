import { describe, expect, it } from "vitest";
import { PROVIDER_REGISTRY, getConnectTarget } from "../provider-registry";

describe("getConnectTarget", () => {
  it("resolves a connect target for every registered provider", () => {
    for (const provider of PROVIDER_REGISTRY) {
      expect(() => getConnectTarget(provider.key, "project-1")).not.toThrow();
      const target = getConnectTarget(provider.key, "project-1");
      if (target.kind === "redirect") {
        expect(target.url).toMatch(/^\/api\/oauth\/.+\?projectId=project-1/);
      } else {
        expect(["apiKey", "email"]).toContain(target.dialog);
      }
    }
  });

  it("throws for an unknown provider key", () => {
    expect(() => getConnectTarget("not-a-real-provider", "project-1")).toThrow();
  });
});

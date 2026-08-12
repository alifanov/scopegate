import { describe, it, expect } from "vitest";
import { INTEGRATIONS_SENTENCE, LANDING_FAQ } from "../faq";
import { PROVIDER_REGISTRY } from "@/lib/provider-registry";

// The marketing copy claims a provider count. Nothing derives it at runtime (the
// registry is too big to ship to the browser), so this is the thing that fails
// when a provider is added or removed and the sentence is left behind.
describe("marketing integration count", () => {
  it("matches PROVIDER_REGISTRY", () => {
    const claimed = Number(INTEGRATIONS_SENTENCE.match(/^(\d+) services/)?.[1]);
    expect(claimed).toBe(PROVIDER_REGISTRY.length);
  });

  it("is the sentence the landing FAQ actually renders", () => {
    const answer = LANDING_FAQ.find((f) => f.q.includes("integrations"))?.a;
    expect(answer).toContain(INTEGRATIONS_SENTENCE);
  });
});

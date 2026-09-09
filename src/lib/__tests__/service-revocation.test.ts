import { describe, expect, it, vi } from "vitest";
import { PROVIDER_REGISTRY, getCredentialGroup } from "../provider-registry";
import { revokeProviderToken } from "../service-revocation";

describe("revokeProviderToken", () => {
  it("routes Google-family providers to revokeGoogle", async () => {
    const revokeGoogle = vi.fn().mockResolvedValue(undefined);
    const revokeLinkedIn = vi.fn().mockResolvedValue(undefined);

    const googleProviders = PROVIDER_REGISTRY.filter((def) => getCredentialGroup(def.key) === "google").map(
      (def) => def.key
    );
    expect(googleProviders.length).toBeGreaterThan(0);

    for (const provider of googleProviders) {
      await revokeProviderToken(provider, "token", { revokeGoogle, revokeLinkedIn });
    }

    expect(revokeGoogle).toHaveBeenCalledTimes(googleProviders.length);
    expect(revokeLinkedIn).not.toHaveBeenCalled();
  });

  it("routes linkedin to revokeLinkedIn", async () => {
    const revokeGoogle = vi.fn().mockResolvedValue(undefined);
    const revokeLinkedIn = vi.fn().mockResolvedValue(undefined);

    await revokeProviderToken("linkedin", "token", { revokeGoogle, revokeLinkedIn });

    expect(revokeLinkedIn).toHaveBeenCalledWith("token");
    expect(revokeGoogle).not.toHaveBeenCalled();
  });

  it("is a no-op for providers with no revocation endpoint", async () => {
    const revokeGoogle = vi.fn().mockResolvedValue(undefined);
    const revokeLinkedIn = vi.fn().mockResolvedValue(undefined);

    await revokeProviderToken("stripe", "token", { revokeGoogle, revokeLinkedIn });

    expect(revokeGoogle).not.toHaveBeenCalled();
    expect(revokeLinkedIn).not.toHaveBeenCalled();
  });
});

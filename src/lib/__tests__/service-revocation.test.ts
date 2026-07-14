import { describe, expect, it, vi } from "vitest";
import { revokeProviderToken } from "../service-revocation";

describe("revokeProviderToken", () => {
  it("routes Google-family providers to revokeGoogle", async () => {
    const revokeGoogle = vi.fn().mockResolvedValue(undefined);
    const revokeLinkedIn = vi.fn().mockResolvedValue(undefined);

    for (const provider of ["gmail", "calendar", "drive", "googleAds", "searchConsole"]) {
      await revokeProviderToken(provider, "token", { revokeGoogle, revokeLinkedIn });
    }

    expect(revokeGoogle).toHaveBeenCalledTimes(5);
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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_KEY_PROVIDERS,
  isApiKeyProvider,
  SERVICE_KEY_VALIDATORS,
} from "../service-key-validators";

describe("isApiKeyProvider", () => {
  it("accepts every registered provider and rejects unknown ones", () => {
    for (const provider of API_KEY_PROVIDERS) {
      expect(isApiKeyProvider(provider)).toBe(true);
    }
    expect(isApiKeyProvider("openai")).toBe(false);
  });

  it("has a validator registered for every provider", () => {
    for (const provider of API_KEY_PROVIDERS) {
      expect(SERVICE_KEY_VALIDATORS[provider]).toBeTypeOf("function");
    }
  });
});

describe("SERVICE_KEY_VALIDATORS", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("validates a Stripe key and labels it Live vs Test by prefix", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    await expect(SERVICE_KEY_VALIDATORS.stripe("sk_live_abc")).resolves.toEqual({
      valid: true,
      label: "Live",
    });
    await expect(SERVICE_KEY_VALIDATORS.stripe("sk_test_abc")).resolves.toEqual({
      valid: true,
      label: "Test",
    });
  });

  it("marks the key invalid on a non-ok response", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);

    await expect(SERVICE_KEY_VALIDATORS.ahrefs("bad-key")).resolves.toEqual({
      valid: false,
    });
  });

  it("treats a Telegram getMe ok:false body as invalid", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false }),
    } as Response);

    await expect(SERVICE_KEY_VALIDATORS.telegram("bad-token")).resolves.toEqual({
      valid: false,
    });
  });

  it("treats a Semrush ERROR body as invalid", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      text: async () => "ERROR :: bad key",
    } as Response);

    await expect(SERVICE_KEY_VALIDATORS.semrush("bad-key")).resolves.toEqual({
      valid: false,
    });
  });
});

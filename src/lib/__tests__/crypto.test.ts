import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { encrypt, decrypt } from "../crypto";

describe("crypto – token encryption (Fix 3)", () => {
  const originalSecret = process.env.BETTER_AUTH_SECRET;

  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET = "test-secret-for-crypto-tests";
  });

  afterAll(() => {
    if (originalSecret !== undefined) {
      process.env.BETTER_AUTH_SECRET = originalSecret;
    } else {
      delete process.env.BETTER_AUTH_SECRET;
    }
  });

  it("roundtrip: decrypt(encrypt(text)) returns original text", () => {
    const plaintext = "my-secret-oauth-token-12345";
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it("different plaintexts produce different ciphertexts", () => {
    const a = encrypt("token-aaa");
    const b = encrypt("token-bbb");
    expect(a).not.toBe(b);
  });

  it("each encrypt() call produces a unique ciphertext (random IV)", () => {
    const plaintext = "same-plaintext";
    const first = encrypt(plaintext);
    const second = encrypt(plaintext);
    expect(first).not.toBe(second);
  });

  it("output format is hex:hex:hex (3 colon-separated parts)", () => {
    const ct = encrypt("test");
    const parts = ct.split(":");
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part).toMatch(/^[0-9a-f]+$/);
    }
  });

  it("decrypt() throws on malformed input (wrong number of parts)", () => {
    expect(() => decrypt("onlytwoparts:here")).toThrow(
      "Invalid encrypted token format"
    );
    expect(() => decrypt("a:b:c:d")).toThrow(
      "Invalid encrypted token format"
    );
  });

  it("decrypt() throws on tampered ciphertext", () => {
    const ct = encrypt("legit-token");
    const parts = ct.split(":");
    // Flip a character in the encrypted data
    const tampered = parts[2][0] === "a" ? "b" + parts[2].slice(1) : "a" + parts[2].slice(1);
    const bad = `${parts[0]}:${parts[1]}:${tampered}`;
    expect(() => decrypt(bad)).toThrow();
  });

  it("encrypt() throws when BETTER_AUTH_SECRET is missing", () => {
    const saved = process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_SECRET;
    try {
      expect(() => encrypt("test")).toThrow(
        "BETTER_AUTH_SECRET is required for token encryption"
      );
    } finally {
      process.env.BETTER_AUTH_SECRET = saved;
    }
  });

  it("decrypt() throws when BETTER_AUTH_SECRET is missing", () => {
    const ct = encrypt("test");
    const saved = process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_SECRET;
    try {
      expect(() => decrypt(ct)).toThrow(
        "BETTER_AUTH_SECRET is required for token encryption"
      );
    } finally {
      process.env.BETTER_AUTH_SECRET = saved;
    }
  });
});

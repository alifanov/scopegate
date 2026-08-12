import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dns/promises before importing safe-fetch (mail-safety re-exports its resolver)
vi.mock("dns/promises", () => ({
  lookup: vi.fn(),
}));

import { lookup } from "dns/promises";
import { resolveMailTarget, MailConnectionError } from "../mail-safety";

const mockLookup = vi.mocked(lookup);

function mockDns(...addresses: Array<{ address: string; family: number }>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockLookup.mockResolvedValue(addresses as any);
}

describe("resolveMailTarget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("private host blocking", () => {
    it("blocks a bare loopback IMAP host before any DNS lookup", async () => {
      await expect(resolveMailTarget("127.0.0.1", 993, "imap")).rejects.toThrow(
        "reserved range"
      );
      expect(mockLookup).not.toHaveBeenCalled();
    });

    it("blocks RFC-1918 10.x.x.x for SMTP", async () => {
      await expect(resolveMailTarget("10.0.0.5", 465, "smtp")).rejects.toThrow(
        "reserved range"
      );
    });

    it("blocks the AWS metadata IP", async () => {
      await expect(
        resolveMailTarget("169.254.169.254", 993, "imap")
      ).rejects.toThrow("reserved range");
    });

    it("blocks IPv4-mapped IPv6 loopback", async () => {
      await expect(
        resolveMailTarget("::ffff:127.0.0.1", 993, "imap")
      ).rejects.toThrow("reserved range");
    });

    it("blocks a hostname whose A record resolves to a private IP", async () => {
      mockDns({ address: "127.0.0.1", family: 4 });
      await expect(
        resolveMailTarget("internal.corp", 993, "imap")
      ).rejects.toThrow("resolves to reserved IP");
    });

    it("allows a hostname that resolves to a public IP and pins the returned address", async () => {
      mockDns({ address: "93.184.216.34", family: 4 });
      const target = await resolveMailTarget("mail.example.com", 993, "imap");
      expect(target).toEqual({
        host: "93.184.216.34",
        servername: "mail.example.com",
        port: 993,
      });
    });
  });

  describe("port allowlist", () => {
    it("rejects a non-standard IMAP port even for a public host", async () => {
      await expect(
        resolveMailTarget("mail.example.com", 5432, "imap")
      ).rejects.toBeInstanceOf(MailConnectionError);
      expect(mockLookup).not.toHaveBeenCalled();
    });

    it("rejects a non-standard SMTP port", async () => {
      await expect(
        resolveMailTarget("mail.example.com", 2525, "smtp")
      ).rejects.toBeInstanceOf(MailConnectionError);
    });

    it("carries a 4xx status so the shared auth-error mapping handles it", async () => {
      await expect(
        resolveMailTarget("mail.example.com", 5432, "imap")
      ).rejects.toMatchObject({ status: 400 });
    });

    it.each([143, 993])("allows IMAP port %d", async (port) => {
      mockDns({ address: "93.184.216.34", family: 4 });
      await expect(
        resolveMailTarget("mail.example.com", port, "imap")
      ).resolves.toBeDefined();
    });

    it.each([25, 465, 587])("allows SMTP port %d", async (port) => {
      mockDns({ address: "93.184.216.34", family: 4 });
      await expect(
        resolveMailTarget("mail.example.com", port, "smtp")
      ).resolves.toBeDefined();
    });
  });
});

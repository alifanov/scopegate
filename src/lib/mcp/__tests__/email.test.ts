import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("dns/promises", () => ({
  lookup: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { serviceConnection: { findUniqueOrThrow: vi.fn() } },
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn((v: string) => v),
  encrypt: vi.fn((v: string) => v),
}));

const mockConnect = vi.fn();
const mockLogout = vi.fn();
vi.mock("imapflow", () => ({
  ImapFlow: vi.fn().mockImplementation(function () {
    return { connect: mockConnect, logout: mockLogout };
  }),
}));

const mockVerify = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockImplementation(() => ({ verify: mockVerify })),
  },
}));

import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { lookup } from "dns/promises";
import { validateEmailConnection } from "../email";

const mockLookup = vi.mocked(lookup);

function mockDns(...addresses: Array<{ address: string; family: number }>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockLookup.mockResolvedValue(addresses as any);
}

describe("validateEmailConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks a private IMAP host without ever opening a socket", async () => {
    const result = await validateEmailConnection({
      imapHost: "127.0.0.1",
      imapPort: 993,
      smtpHost: "smtp.example.com",
      smtpPort: 465,
      username: "a@example.com",
      password: "pw",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("reserved range");
    expect(ImapFlow).not.toHaveBeenCalled();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it("blocks a private SMTP host without ever opening a socket", async () => {
    mockDns({ address: "93.184.216.34", family: 4 });

    const result = await validateEmailConnection({
      imapHost: "imap.example.com",
      imapPort: 993,
      smtpHost: "169.254.169.254",
      smtpPort: 465,
      username: "a@example.com",
      password: "pw",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("reserved range");
    expect(ImapFlow).not.toHaveBeenCalled();
  });

  it("rejects a port outside the mail allowlist", async () => {
    const result = await validateEmailConnection({
      imapHost: "imap.example.com",
      imapPort: 5432,
      smtpHost: "smtp.example.com",
      smtpPort: 465,
      username: "a@example.com",
      password: "pw",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("not allowed");
    expect(ImapFlow).not.toHaveBeenCalled();
  });

  it("returns a generic error and does not leak the raw IMAP failure reason", async () => {
    mockDns({ address: "93.184.216.34", family: 4 });
    mockConnect.mockRejectedValue(new Error("ECONNREFUSED 93.184.216.34:993"));

    const result = await validateEmailConnection({
      imapHost: "imap.example.com",
      imapPort: 993,
      smtpHost: "smtp.example.com",
      smtpPort: 465,
      username: "a@example.com",
      password: "pw",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Failed to connect to the mail server");
    expect(result.error).not.toContain("ECONNREFUSED");
  });

  it("succeeds when both IMAP and SMTP checks pass", async () => {
    mockDns({ address: "93.184.216.34", family: 4 });
    mockConnect.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(undefined);
    mockVerify.mockResolvedValue(true);

    const result = await validateEmailConnection({
      imapHost: "imap.example.com",
      imapPort: 993,
      smtpHost: "smtp.example.com",
      smtpPort: 465,
      username: "a@example.com",
      password: "pw",
    });

    expect(result).toEqual({ valid: true });
  });
});

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
const mockList = vi.fn();
const mockGetMailboxLock = vi.fn();
const mockMessageMove = vi.fn();
const mailboxState: { exists: number } = { exists: 0 };
vi.mock("imapflow", () => ({
  ImapFlow: vi.fn().mockImplementation(function () {
    return {
      connect: mockConnect,
      logout: mockLogout,
      list: mockList,
      getMailboxLock: mockGetMailboxLock,
      messageMove: mockMessageMove,
      mailbox: mailboxState,
    };
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
import { db } from "@/lib/db";
import {
  validateEmailConnection,
  emailListMailboxes,
  emailMoveMessage,
} from "../email";

const mockLookup = vi.mocked(lookup);

function mockDns(...addresses: Array<{ address: string; family: number }>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockLookup.mockResolvedValue(addresses as any);
}

function mockConnection() {
  vi.mocked(db.serviceConnection.findUniqueOrThrow).mockResolvedValue({
    id: "conn-1",
    accessToken: "encrypted",
    accountEmail: "user@example.com",
    metadata: { imapHost: "imap.example.com", imapPort: 993 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
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

describe("IMAP resource lifecycle (withImap / withMailbox)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDns({ address: "93.184.216.34", family: 4 });
    mockConnection();
    mockConnect.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(undefined);
    mailboxState.exists = 0;
  });

  it("logs out after a successful call with no mailbox lock involved", async () => {
    mockList.mockResolvedValue([]);

    await emailListMailboxes("conn-1");

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("still logs out when the callback throws with no mailbox lock involved", async () => {
    mockList.mockRejectedValue(new Error("boom"));

    await expect(emailListMailboxes("conn-1")).rejects.toThrow("boom");

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("releases the mailbox lock and logs out on success", async () => {
    const release = vi.fn();
    mockGetMailboxLock.mockResolvedValue({ release });
    mockMessageMove.mockResolvedValue(undefined);

    await emailMoveMessage("conn-1", "INBOX", 1, "Archive");

    expect(release).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("still releases the mailbox lock and logs out when the callback throws", async () => {
    const release = vi.fn();
    mockGetMailboxLock.mockResolvedValue({ release });
    mockMessageMove.mockRejectedValue(new Error("move failed"));

    await expect(emailMoveMessage("conn-1", "INBOX", 1, "Archive")).rejects.toThrow(
      "move failed"
    );

    expect(release).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("still attempts logout (swallowed) when connect itself fails", async () => {
    mockConnect.mockRejectedValue(new Error("ETIMEDOUT"));

    await expect(emailListMailboxes("conn-1")).rejects.toThrow("ETIMEDOUT");

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

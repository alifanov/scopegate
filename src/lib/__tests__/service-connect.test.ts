import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { serviceConnection: { upsert: vi.fn() } },
}));

import { db } from "@/lib/db";
import { connectApiKey, connectEmailAccount, ServiceConnectError } from "../service-connect";

const mockUpsert = vi.mocked(db.serviceConnection.upsert);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("connectApiKey", () => {
  it("rejects an unsupported provider", async () => {
    await expect(
      connectApiKey({ projectId: "p1", provider: "not-a-provider", apiKey: "k" })
    ).rejects.toMatchObject({ message: "Unsupported provider", status: 400 });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid key without persisting", async () => {
    const validators = { stripe: vi.fn().mockResolvedValue({ valid: false }) };

    await expect(
      connectApiKey(
        { projectId: "p1", provider: "stripe", apiKey: "bad" },
        { validators, encrypt: (v) => `enc(${v})` }
      )
    ).rejects.toBeInstanceOf(ServiceConnectError);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("persists and resets the failure counter on a valid key", async () => {
    const validators = {
      stripe: vi.fn().mockResolvedValue({ valid: true, label: "Stripe Prod" }),
    };
    mockUpsert.mockResolvedValue({ id: "conn-1" } as never);

    await connectApiKey(
      { projectId: "p1", provider: "stripe", apiKey: "sk_live_x" },
      { validators, encrypt: (v) => `enc(${v})` }
    );

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          projectId_provider_accountEmail: {
            projectId: "p1",
            provider: "stripe",
            accountEmail: "Stripe Prod",
          },
        },
        update: expect.objectContaining({
          accessToken: "enc(sk_live_x)",
          consecutiveFailures: 0,
          status: "active",
        }),
      })
    );
  });
});

describe("connectEmailAccount", () => {
  it("rejects a failed IMAP/SMTP check without persisting", async () => {
    const validateConnection = vi.fn().mockResolvedValue({ valid: false, error: "IMAP failed" });

    await expect(
      connectEmailAccount(
        {
          projectId: "p1",
          email: "a@example.com",
          password: "pw",
          imapHost: "imap.example.com",
          smtpHost: "smtp.example.com",
        },
        { validateConnection, encrypt: (v) => `enc(${v})` }
      )
    ).rejects.toMatchObject({ message: "IMAP failed", status: 422 });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("persists metadata and resets the failure counter on success", async () => {
    const validateConnection = vi.fn().mockResolvedValue({ valid: true });
    mockUpsert.mockResolvedValue({ id: "conn-1" } as never);

    await connectEmailAccount(
      {
        projectId: "p1",
        email: "a@example.com",
        password: "pw",
        imapHost: "imap.example.com",
        smtpHost: "smtp.example.com",
      },
      { validateConnection, encrypt: (v) => `enc(${v})` }
    );

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          accessToken: "enc(pw)",
          consecutiveFailures: 0,
          status: "active",
          metadata: expect.objectContaining({ imapHost: "imap.example.com" }),
        }),
      })
    );
  });
});

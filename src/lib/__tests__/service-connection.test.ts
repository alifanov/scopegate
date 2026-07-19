import { describe, expect, it, vi } from "vitest";
import { upsertServiceConnection } from "../service-connection";

describe("upsertServiceConnection", () => {
  it("resets consecutiveFailures and reactivates status on reconnect", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "conn-1" });

    await upsertServiceConnection(
      {
        projectId: "project-1",
        provider: "github",
        accountEmail: "user@example.com",
        accessToken: "enc-token",
        refreshToken: "enc-refresh",
      },
      { upsert }
    );

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: "active",
          lastError: null,
          consecutiveFailures: 0,
        }),
      })
    );
  });

  it("omits expiresAt from the update when not provided (API key / email reconnect)", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "conn-1" });

    await upsertServiceConnection(
      {
        projectId: "project-1",
        provider: "stripe",
        accountEmail: "API Key",
        accessToken: "enc-token",
        refreshToken: null,
      },
      { upsert }
    );

    const call = upsert.mock.calls[0][0];
    expect(call.update).not.toHaveProperty("expiresAt");
  });

  it("overwrites expiresAt when explicitly passed (OAuth reconnect without a new expiry)", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "conn-1" });

    await upsertServiceConnection(
      {
        projectId: "project-1",
        provider: "github",
        accountEmail: "user@example.com",
        accessToken: "enc-token",
        refreshToken: null,
        expiresAt: null,
      },
      { upsert }
    );

    const call = upsert.mock.calls[0][0];
    expect(call.update).toHaveProperty("expiresAt", null);
  });

  it("defaults consecutiveFailures to 0 on create", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "conn-1" });

    await upsertServiceConnection(
      {
        projectId: "project-1",
        provider: "email",
        accountEmail: "user@example.com",
        accessToken: "enc-token",
        refreshToken: null,
        metadata: { imapHost: "imap.example.com" },
      },
      { upsert }
    );

    const call = upsert.mock.calls[0][0];
    expect(call.create).toMatchObject({
      projectId: "project-1",
      provider: "email",
      metadata: { imapHost: "imap.example.com" },
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { acceptInvite, isInviteTokenValid } from "../accept-invite";

const database = {
  inviteToken: { findUnique: vi.fn(), updateMany: vi.fn() },
  user: { create: vi.fn() },
  account: { create: vi.fn() },
};

function transaction<T>(fn: (tx: typeof database) => Promise<T>): Promise<T> {
  return fn(database);
}

const hashPassword = vi.fn().mockResolvedValue("hashed");
const generateId = () => "account-1";

const validInvite = {
  token: "tok",
  email: null,
  expiresAt: new Date(Date.now() + 60_000),
  usedAt: null,
};

describe("acceptInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.inviteToken.updateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects an unknown token", async () => {
    database.inviteToken.findUnique.mockResolvedValue(null);

    await expect(
      acceptInvite(
        { token: "bad", email: "a@b.com", password: "longenoughpw" },
        { database, transaction, hashPassword, generateId }
      )
    ).rejects.toMatchObject({ message: "Invalid invite link", status: 404 });
  });

  it("rejects an already-used invite", async () => {
    database.inviteToken.findUnique.mockResolvedValue({
      ...validInvite,
      usedAt: new Date(),
    });

    await expect(
      acceptInvite(
        { token: "tok", email: "a@b.com", password: "longenoughpw" },
        { database, transaction, hashPassword, generateId }
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects an expired invite", async () => {
    database.inviteToken.findUnique.mockResolvedValue({
      ...validInvite,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      acceptInvite(
        { token: "tok", email: "a@b.com", password: "longenoughpw" },
        { database, transaction, hashPassword, generateId }
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects an email that doesn't match the invite", async () => {
    database.inviteToken.findUnique.mockResolvedValue({
      ...validInvite,
      email: "invited@b.com",
    });

    await expect(
      acceptInvite(
        { token: "tok", email: "other@b.com", password: "longenoughpw" },
        { database, transaction, hashPassword, generateId }
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a password shorter than the minimum length", async () => {
    database.inviteToken.findUnique.mockResolvedValue(validInvite);
    const shortPassword = "a".repeat(MIN_PASSWORD_LENGTH - 1);

    await expect(
      acceptInvite(
        { token: "tok", email: "a@b.com", password: shortPassword },
        { database, transaction, hashPassword, generateId }
      )
    ).rejects.toMatchObject({
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      status: 400,
    });

    expect(hashPassword).not.toHaveBeenCalled();
    expect(database.user.create).not.toHaveBeenCalled();
  });

  it("accepts a password exactly at the minimum length", async () => {
    database.inviteToken.findUnique.mockResolvedValue(validInvite);
    database.user.create.mockResolvedValue({ id: "user-1", email: "a@b.com" });
    const boundaryPassword = "a".repeat(MIN_PASSWORD_LENGTH);

    await expect(
      acceptInvite(
        { token: "tok", email: "a@b.com", password: boundaryPassword },
        { database, transaction, hashPassword, generateId }
      )
    ).resolves.toMatchObject({ id: "user-1" });

    expect(hashPassword).toHaveBeenCalledWith(boundaryPassword);
  });

  it("creates the user, account, and marks the invite used on the happy path", async () => {
    database.inviteToken.findUnique.mockResolvedValue(validInvite);
    database.user.create.mockResolvedValue({ id: "user-1", email: "a@b.com" });

    const user = await acceptInvite(
      { token: "tok", email: "A@B.com", name: "A", password: "longenoughpw" },
      { database, transaction, hashPassword, generateId }
    );

    expect(user).toMatchObject({ id: "user-1" });
    expect(database.inviteToken.updateMany).toHaveBeenCalledWith({
      where: { token: "tok", usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    expect(database.user.create).toHaveBeenCalledWith({
      data: { email: "a@b.com", name: "A", emailVerified: true },
    });
    expect(database.account.create).toHaveBeenCalledWith({
      data: {
        id: "account-1",
        accountId: "user-1",
        providerId: "credential",
        userId: "user-1",
        password: "hashed",
      },
    });
  });

  it("rejects a duplicate email via the unique constraint instead of a pre-check", async () => {
    database.inviteToken.findUnique.mockResolvedValue(validInvite);
    database.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    await expect(
      acceptInvite(
        { token: "tok", email: "a@b.com", password: "longenoughpw" },
        { database, transaction, hashPassword, generateId }
      )
    ).rejects.toMatchObject({
      message: "An account with this email already exists",
      status: 400,
    });

    expect(database.account.create).not.toHaveBeenCalled();
  });

  it("rejects a concurrent accept of the same token without creating an orphaned user", async () => {
    database.inviteToken.findUnique.mockResolvedValue(validInvite);
    database.inviteToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      acceptInvite(
        { token: "tok", email: "a@b.com", password: "longenoughpw" },
        { database, transaction, hashPassword, generateId }
      )
    ).rejects.toMatchObject({
      message: "This invite link has already been used",
      status: 400,
    });

    expect(database.user.create).not.toHaveBeenCalled();
  });
});

describe("isInviteTokenValid", () => {
  const findUnique = vi.fn();

  beforeEach(() => {
    findUnique.mockReset();
  });

  it("is false for an unknown token", async () => {
    findUnique.mockResolvedValue(null);
    await expect(isInviteTokenValid("bad", { findUnique })).resolves.toBe(false);
  });

  it("is false for an already-used invite", async () => {
    findUnique.mockResolvedValue({ ...validInvite, usedAt: new Date() });
    await expect(isInviteTokenValid("tok", { findUnique })).resolves.toBe(false);
  });

  it("is false for an expired invite", async () => {
    findUnique.mockResolvedValue({
      ...validInvite,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(isInviteTokenValid("tok", { findUnique })).resolves.toBe(false);
  });

  it("is true for a valid invite", async () => {
    findUnique.mockResolvedValue(validInvite);
    await expect(isInviteTokenValid("tok", { findUnique })).resolves.toBe(true);
  });
});

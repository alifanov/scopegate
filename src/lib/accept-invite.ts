import crypto from "node:crypto";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";

type AcceptInviteDatabase = {
  inviteToken: Pick<typeof db.inviteToken, "findUnique" | "updateMany">;
  user: Pick<typeof db.user, "create">;
  account: Pick<typeof db.account, "create">;
};

type TransactionRunner = <T>(
  fn: (tx: AcceptInviteDatabase) => Promise<T>
) => Promise<T>;

async function defaultTransaction<T>(
  fn: (tx: AcceptInviteDatabase) => Promise<T>
): Promise<T> {
  return db.$transaction((tx) => fn(tx));
}

async function defaultHashPassword(password: string): Promise<string> {
  const ctx = await auth.$context;
  return ctx.password.hash(password);
}

export class AcceptInviteError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AcceptInviteError";
    this.status = status;
  }
}

export type AcceptInviteInput = {
  token: string;
  email: string;
  name?: string;
  password: string;
};

type AcceptInviteOptions = {
  database?: AcceptInviteDatabase;
  transaction?: TransactionRunner;
  hashPassword?: (password: string) => Promise<string>;
  generateId?: () => string;
};

export async function acceptInvite(
  input: AcceptInviteInput,
  {
    database = db,
    transaction = defaultTransaction,
    hashPassword = defaultHashPassword,
    generateId = () => crypto.randomUUID(),
  }: AcceptInviteOptions = {}
) {
  const email = input.email.toLowerCase();

  const invite = await database.inviteToken.findUnique({
    where: { token: input.token },
  });

  if (!invite) {
    throw new AcceptInviteError("Invalid invite link", 404);
  }
  if (invite.usedAt) {
    throw new AcceptInviteError("This invite link has already been used", 400);
  }
  if (invite.expiresAt < new Date()) {
    throw new AcceptInviteError("This invite link has expired", 400);
  }
  if (invite.email && invite.email.toLowerCase() !== email) {
    throw new AcceptInviteError(
      "This invite is for a different email address",
      400
    );
  }

  const hashedPassword = await hashPassword(input.password);

  return transaction(async (tx) => {
    // Conditional update guards against a concurrent accept of the same
    // token; a partial write here (invite consumed, no user) rolls back
    // together with the rest of the transaction on any later failure.
    const consumed = await tx.inviteToken.updateMany({
      where: { token: input.token, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new AcceptInviteError(
        "This invite link has already been used",
        400
      );
    }

    let user;
    try {
      user = await tx.user.create({
        data: { email, name: input.name || "", emailVerified: true },
      });
    } catch (error) {
      // Unique constraint on User.email — rely on the DB instead of a
      // pre-check findUnique, which is a TOCTOU race under concurrent signup.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AcceptInviteError(
          "An account with this email already exists",
          400
        );
      }
      throw error;
    }

    await tx.account.create({
      data: {
        id: generateId(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });

    return user;
  });
}

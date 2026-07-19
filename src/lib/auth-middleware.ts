import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { isAdmin } from "./admin";

export type CurrentUser = {
  userId: string;
  email: string;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AuthError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  throw error;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return null;
  return { userId: session.user.id, email: session.user.email };
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireCurrentUser();
  if (!isAdmin(user.email)) {
    throw new ForbiddenError();
  }
  return user;
}

/**
 * Collapses the repeated "require admin, map auth errors" preamble shared
 * by every admin-only route handler.
 */
export function withAdminAuth(
  handler: (request: Request, user: CurrentUser) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const user = await requireAdmin();
      return await handler(request, user);
    } catch (error) {
      return authErrorResponse(error);
    }
  };
}

/**
 * Collapses the repeated "require a logged-in user, map auth errors"
 * preamble shared by every user-scoped (non-project, non-admin) route handler.
 */
export function withUserAuth(
  handler: (request: Request, user: CurrentUser) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const user = await requireCurrentUser();
      return await handler(request, user);
    } catch (error) {
      return authErrorResponse(error);
    }
  };
}

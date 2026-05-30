import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Valid Server Action IDs are 40-char hex SHA-1 hashes.
// Reject anything else (e.g. "x") to silence bot-scan noise.
const VALID_ACTION_ID = /^[0-9a-f]{40}$/;

export function middleware(request: NextRequest) {
  const actionId = request.headers.get("Next-Action");
  if (actionId !== null && !VALID_ACTION_ID.test(actionId)) {
    console.info(
      `[middleware] blocked invalid Next-Action from ${request.headers.get("x-forwarded-for") ?? "unknown"}: "${actionId.slice(0, 16)}…"`,
    );
    return new NextResponse(null, {
      status: 400,
      headers: { "x-blocked-by": "invalid-next-action" },
    });
  }

  const { pathname } = request.nextUrl;

  // Public paths — skip auth check
  if (
    pathname.startsWith("/api/mcp") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/oauth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/invite") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Dashboard routes — require session cookie
  const sessionToken = getSessionCookie(request);
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

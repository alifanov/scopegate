import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — skip auth check
  if (
    pathname.startsWith("/api/mcp") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/oauth") ||
    pathname.startsWith("/login") ||
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

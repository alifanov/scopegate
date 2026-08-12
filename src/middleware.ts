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
      `[middleware] blocked invalid Next-Action` +
        ` ip=${request.headers.get("x-forwarded-for") ?? "unknown"}` +
        ` ua="${(request.headers.get("user-agent") ?? "-").slice(0, 120)}"` +
        ` ${request.method} ${request.nextUrl.pathname}` +
        `: "${actionId.slice(0, 16)}…"`,
    );
    return new NextResponse(null, {
      status: 400,
      headers: { "x-blocked-by": "invalid-next-action" },
    });
  }

  const { pathname } = request.nextUrl;

  // Marketing pages are public in both modes; whether they render at all is
  // decided per page by isCloud() (a runtime env read, which the edge runtime
  // here cannot do reliably — process.env is inlined into this bundle).
  const isPublicPath =
    pathname.startsWith("/api/mcp") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/oauth") ||
    pathname.startsWith("/api/cron") ||
    pathname === "/api/health" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/magic-link") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/compare") ||
    pathname.startsWith("/glossary") ||
    pathname.startsWith("/integrations") ||
    pathname === "/" ||
    pathname === "/features" ||
    pathname === "/pricing" ||
    pathname === "/docs" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/cookies" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt";

  if (isPublicPath) {
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg)$).*)",
  ],
};

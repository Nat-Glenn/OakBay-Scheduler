/**
 * Protects app pages and API routes — requires a Firebase session cookie.
 * Login and session exchange routes stay public.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthSkipped } from "@/lib/authConfig";

/** Must match SESSION_COOKIE_NAME in lib/authGuard.ts */
const SESSION_COOKIE_NAME = "__session";

const PUBLIC_PAGE_PREFIXES = ["/Login"];

const PUBLIC_API_PREFIXES = ["/api/auth/session"];

function isPublicPage(pathname: string) {
  return PUBLIC_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPublicApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAuthSkipped()) {
    if (pathname === "/Login" || pathname.startsWith("/Login/")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  if (isPublicPage(pathname) || isPublicApi(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized — sign in required" },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/Login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};

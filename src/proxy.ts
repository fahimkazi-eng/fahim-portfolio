import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Route protection for /admin.
 *
 * This is a convenience redirect only — it avoids rendering a page shell to
 * someone who is not signed in. It is NOT the security boundary: every
 * Server Action and every server-side data read calls `requireUser()`
 * independently, so bypassing this file grants nothing.
 *
 * Next 16 renamed `middleware` to `proxy`. Edge runtime is not available
 * here, and `runtime` must not be set.
 */

const SESSION_COOKIE = "kf_session";
const PUBLIC_PREFIXES = ["/admin/login"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let authenticated = false;

  if (token) {
    try {
      const secret = process.env.AUTH_SECRET;
      if (!secret) throw new Error("AUTH_SECRET missing");
      await jwtVerify(token, new TextEncoder().encode(secret));
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (authenticated) {
    // Already signed in and asking for the login page → go to the dashboard.
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  // Preserve where they were heading, but only for GET navigations.
  if (request.method === "GET" && !pathname.startsWith("/_next")) {
    loginUrl.searchParams.set("from", `${pathname}${search}`);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};

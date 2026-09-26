import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Proxy gate for the admin area (Next.js 16's `proxy` convention, formerly
 * `middleware`).
 *
 * This only checks the signed session cookie — no database access — so it is a
 * fast, edge-safe first filter. Every admin page and server action on top of it
 * also calls `requireAdmin()`, which re-loads the account from the database and
 * is the authoritative authorization check.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isLogin = pathname === "/admin/login";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!isLogin && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isLogin && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

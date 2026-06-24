import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

// Everything is gated by the single shared site password, except the login
// page itself, the login API, and Next's static assets.
const PUBLIC_PATHS = ["/login", "/api/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const expected = process.env.SITE_PASSWORD;
  // If no password is configured, fail open in dev so the app is usable,
  // but this should always be set in production (Vercel env).
  if (!expected) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except Next internals, the assets folder, and common files.
  matcher: ["/((?!_next/static|_next/image|assets|favicon.ico).*)"],
};

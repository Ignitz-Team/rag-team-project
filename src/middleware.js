import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Deny-by-default: everything not explicitly listed here requires a valid
// session cookie. New pages/API routes are protected automatically unless
// added below, rather than needing to remember to protect them individually.
const PUBLIC_PAGES = new Set(["/", "/login", "/register"]);
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/users"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PAGES.has(pathname) || PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

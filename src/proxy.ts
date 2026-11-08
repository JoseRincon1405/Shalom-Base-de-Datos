import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/constants";
import { verifySessionToken } from "@/lib/jwt";

const PROTECTED_PREFIXES = ["/pos", "/cierre", "/admin"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const homeFor = (rol: string) => (rol === "ADMIN" ? "/admin" : "/pos");

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL(homeFor(session.rol), request.url));
    }
    return NextResponse.next();
  }

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && session.rol !== "ADMIN") {
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/pos",
    "/pos/:path*",
    "/cierre",
    "/cierre/:path*",
    "/admin",
    "/admin/:path*",
  ],
};

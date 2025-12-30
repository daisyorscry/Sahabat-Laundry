import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const isAppRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/orders") ||
    req.nextUrl.pathname.startsWith("/services") ||
    req.nextUrl.pathname.startsWith("/pricing") ||
    req.nextUrl.pathname.startsWith("/customers") ||
    req.nextUrl.pathname.startsWith("/reports") ||
    req.nextUrl.pathname.startsWith("/settings") ||
    /^\/\(app\)(\/.*)?$/.test(req.nextUrl.pathname);

  if (isAppRoute && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/services/:path*",
    "/pricing/:path*",
    "/customers/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/(app)/(.*)",
  ],
};

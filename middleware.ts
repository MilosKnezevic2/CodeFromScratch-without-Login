import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for NextAuth session token
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;
  const isLoggedIn = !!token;

  // Allow Sanity Studio through — it has its own auth
  if (pathname.startsWith("/portal-cfs-admin/studio")) {
    return NextResponse.next();
  }

  // Allow admin login page through
  if (pathname === "/portal-cfs-admin/login") {
    return NextResponse.next();
  }

  // Protect portal-cfs-admin routes with custom cookie
  if (pathname.startsWith("/portal-cfs-admin")) {
    const adminToken = request.cookies.get("cfs-admin-token")?.value;
    if (adminToken !== "authenticated") {
      return NextResponse.redirect(
        new URL("/portal-cfs-admin/login", request.nextUrl.origin)
      );
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from auth pages
  const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];
  if (isLoggedIn && authPages.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/portal-cfs-admin/:path*",
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};

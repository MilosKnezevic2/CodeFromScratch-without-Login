import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { isTrustedOrigin } from "@/lib/csrf";

// Next 16 name for the edge request hook (the `middleware` file convention
// is deprecated). Runs on Edge — Web Crypto only, no node:crypto.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF protection: verify Origin on mutating requests to API routes.
  // Trusts the deployment's own origin (previews included) plus the
  // configured public site URL; requests without an Origin header pass —
  // they are not browser form/fetch submissions.
  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/stripe/webhooks")
  ) {
    const origin = request.headers.get("origin");
    if (!isTrustedOrigin(origin, request.url, process.env.NEXT_PUBLIC_SITE_URL)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

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

  // Protect portal-cfs-admin routes with a cryptographically signed session token.
  if (pathname.startsWith("/portal-cfs-admin")) {
    const adminToken = request.cookies.get("cfs-admin-token")?.value;
    if (!(await verifyAdminSession(adminToken))) {
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
    "/api/:path*",
  ],
};

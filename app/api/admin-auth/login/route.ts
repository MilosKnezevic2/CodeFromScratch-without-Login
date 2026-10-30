import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/admin-auth";
import { createAdminSession } from "@/lib/admin-session";
import { rateLimit } from "@/lib/rate-limit";
import { lockedMessage } from "../check/route";

export const ADMIN_COOKIE = "cfs-admin-token";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!rateLimit(`admin-login:${ip ?? "unknown"}`, 5, 15 * 60 * 1000).success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { username?: unknown; password?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const code = typeof body.code === "string" && body.code ? body.code : undefined;

  const result = await login({ username, password, code, ip });
  if (!result.ok) {
    switch (result.reason) {
      case "unconfigured":
        return NextResponse.json({ error: "Admin authentication not configured" }, { status: 503 });
      case "unavailable":
        return NextResponse.json({ error: "Login is temporarily unavailable. Try again in a minute." }, { status: 503 });
      case "locked":
        return NextResponse.json({ error: lockedMessage(result.retryAt) }, { status: 429 });
      case "code-required":
        return NextResponse.json({ error: "MFA code required" }, { status: 401 });
      case "code-invalid":
        return NextResponse.json({ error: "Invalid MFA code" }, { status: 401 });
      default:
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  }

  const token = await createAdminSession();
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

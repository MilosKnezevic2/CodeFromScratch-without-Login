import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success } = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const adminUsername = process.env.CFS_ADMIN_USERNAME;
  const adminPassword = process.env.CFS_ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return NextResponse.json(
      { error: "Admin authentication not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { username, password } = body;

  if (
    username === adminUsername &&
    password === adminPassword
  ) {
    const token = createAdminSession();
    const response = NextResponse.json({ success: true });
    response.cookies.set("cfs-admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

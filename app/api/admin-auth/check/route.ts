import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isAdminMfaConfigured } from "@/lib/admin-mfa";

/**
 * Admin pre-auth probe.
 *
 * Mirrors the user-side /api/auth/mfa-check. The admin login form
 * calls this with username + password; if both match the env-
 * configured admin credentials AND `CFS_ADMIN_MFA_SECRET` is set,
 * the response says `mfaRequired: true` and the form switches to
 * the TOTP stage. Otherwise it tells the form to proceed with the
 * existing /login endpoint.
 *
 * This endpoint never issues a session cookie. It only signals
 * what the second step is.
 *
 * Rate-limit shares the same key/window as /login (5/15min/IP) so
 * an attacker can't probe one path to relax the other.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limiter = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
  if (!limiter.success) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  const adminUsername = process.env.CFS_ADMIN_USERNAME;
  const adminPassword = process.env.CFS_ADMIN_PASSWORD;
  if (!adminUsername || !adminPassword) {
    return NextResponse.json(
      { ok: false, error: "Admin authentication not configured" },
      { status: 503 },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (username !== adminUsername || password !== adminPassword) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true, mfaRequired: isAdminMfaConfigured() });
}

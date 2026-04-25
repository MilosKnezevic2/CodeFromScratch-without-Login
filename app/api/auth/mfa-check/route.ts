import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/credentials";

/**
 * Pre-auth probe.
 *
 * The login form calls this BEFORE invoking NextAuth's signIn so it
 * knows whether to show the second-step MFA prompt. Returns:
 *   - { ok: false }                                — bad credentials
 *   - { ok: true, mfaRequired: false }             — proceed with signIn
 *   - { ok: true, mfaRequired: true }              — show MFA stage
 *
 * Security note: the endpoint reveals "this email + password is
 * valid AND MFA is on" only to a caller who already has valid
 * credentials. Anyone without valid credentials gets the same
 * { ok: false } as a wrong-password attempt. No new oracle vs. the
 * existing signIn flow.
 *
 * Rate-limited per IP to slow down credential-stuffing attempts.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limiter = rateLimit(`mfa-check:${ip}`, 5, 60_000);
  if (!limiter.success) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = await verifyPassword(email, password);
  if (!user) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true, mfaRequired: user.mfaEnabled });
}

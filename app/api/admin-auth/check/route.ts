import { NextRequest, NextResponse } from "next/server";
import { checkCredentials } from "@/lib/admin-auth";
import { clientIp, recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Admin pre-auth probe. The login form sends username and password; the
 * answer says whether a second step (a 6-digit code) follows. No session is
 * issued here. A wrong pair counts towards the account lockout, and the
 * rate limit shares its key with /login so neither path relaxes the other.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000).success) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  const result = await checkCredentials(username, password);
  if (!result.ok) {
    // The login page probes here first, so a wrong password shows up in the
    // activity log from this step, not only from the final sign-in call.
    if (result.reason === "invalid" || result.reason === "locked") {
      await recordAudit("login.failed", { reason: result.reason }, clientIp(request.headers));
    }
    if (result.reason === "unconfigured") {
      return NextResponse.json({ ok: false, error: "Admin authentication not configured" }, { status: 503 });
    }
    if (result.reason === "unavailable") {
      return NextResponse.json({ ok: false, error: "Login is temporarily unavailable. Try again in a minute." }, { status: 503 });
    }
    if (result.reason === "locked") {
      return NextResponse.json({ ok: false, error: lockedMessage(result.retryAt) }, { status: 429 });
    }
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({ ok: true, mfaRequired: result.mfaRequired });
}

export function lockedMessage(retryAt?: Date): string {
  const minutes = retryAt ? Math.max(1, Math.ceil((retryAt.getTime() - Date.now()) / 60_000)) : 15;
  return `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

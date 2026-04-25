import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTotpCode } from "@/lib/services/mfa";

/**
 * Disable MFA on the user account.
 *
 * Re-authentication is required so that someone who hijacks an
 * already-open session cannot turn MFA off without proving they are
 * the account owner:
 *  - Credential accounts: password.
 *  - OAuth accounts (no passwordHash): a current TOTP code from the
 *    enrolled authenticator. We never let an OAuth user disable MFA
 *    without proving possession of the second factor.
 *
 * Disabling clears the secret + backup codes so re-enabling produces
 * a fresh secret (recommended by OWASP MFA guidance — never reuse a
 * secret that was previously disabled).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limiter = rateLimit(`mfa-disable:${session.user.id}`, 5, 60_000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: { password?: unknown; totpCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const totpCode = typeof body.totpCode === "string" ? body.totpCode.trim() : "";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      passwordHash: true,
      mfaEnabled: true,
      mfaSecret: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json(
      { error: "MFA is not enabled" },
      { status: 400 },
    );
  }

  if (user.passwordHash) {
    if (!password) {
      return NextResponse.json(
        { error: "Password is required to disable MFA" },
        { status: 400 },
      );
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 400 },
      );
    }
  } else {
    if (!totpCode) {
      return NextResponse.json(
        { error: "TOTP code is required to disable MFA on OAuth accounts" },
        { status: 400 },
      );
    }
    const ok = verifyTotpCode(user.mfaSecret, totpCode);
    if (!ok) {
      return NextResponse.json({ error: "Invalid TOTP code" }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
      mfaVerifiedAt: null,
    },
  });

  return NextResponse.json({ success: true });
}

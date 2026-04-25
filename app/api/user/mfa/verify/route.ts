import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { consumeBackupCode, verifyTotpCode } from "@/lib/services/mfa";

/**
 * Verify a TOTP code or a single-use backup code.
 *
 * Two scenarios:
 * 1. Enrolment confirmation — `mfaEnabled` is false and a secret was
 *    just stored by `/setup`. A successful verification flips
 *    `mfaEnabled` to true and stamps `mfaVerifiedAt`.
 * 2. Ongoing verification — used by the login flow once MFA is
 *    enabled. Returns 200 on success without mutating state, except
 *    that successful backup code use removes the consumed code.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limiter = rateLimit(`mfa-verify:${session.user.id}`, 10, 60_000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: { code?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const type = body.type === "backup" ? "backup" : "totp";

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      mfaEnabled: true,
      mfaSecret: true,
      mfaBackupCodes: true,
    },
  });

  if (!user || !user.mfaSecret) {
    return NextResponse.json(
      { error: "MFA is not set up for this account" },
      { status: 400 },
    );
  }

  if (type === "backup") {
    const remaining = await consumeBackupCode(code, user.mfaBackupCodes);
    if (!remaining) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaBackupCodes: remaining,
        ...(user.mfaEnabled
          ? {}
          : { mfaEnabled: true, mfaVerifiedAt: new Date() }),
      },
    });
    return NextResponse.json({
      success: true,
      backupCodesRemaining: remaining.length,
    });
  }

  const ok = verifyTotpCode(user.mfaSecret, code);
  if (!ok) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (!user.mfaEnabled) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mfaEnabled: true, mfaVerifiedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}

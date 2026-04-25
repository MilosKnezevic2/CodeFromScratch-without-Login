import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { createEnrolment } from "@/lib/services/mfa";

/**
 * Begin MFA enrolment.
 *
 * Generates a fresh TOTP secret + 10 backup codes and stores the
 * encrypted secret + hashed backup codes on the user row, but does
 * NOT yet flip `mfaEnabled`. Enabling happens only after the user
 * proves possession of the authenticator by submitting a valid TOTP
 * to `/api/user/mfa/verify`.
 *
 * The plaintext backup codes are returned ONCE in this response —
 * the client must show them to the user and never request them
 * again.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limiter = rateLimit(`mfa-setup:${session.user.id}`, 5, 60_000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaEnabled: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.mfaEnabled) {
    return NextResponse.json(
      { error: "MFA is already enabled. Disable it first to re-enrol." },
      { status: 409 },
    );
  }

  const enrolment = await createEnrolment(session.user.email);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaSecret: enrolment.encryptedSecret,
      mfaBackupCodes: enrolment.backupCodesHashed,
      mfaEnabled: false,
      mfaVerifiedAt: null,
    },
  });

  void request;

  return NextResponse.json({
    qrCodeDataUrl: enrolment.qrCodeDataUrl,
    otpauthUri: enrolment.otpauthUri,
    backupCodes: enrolment.backupCodesPlain,
  });
}

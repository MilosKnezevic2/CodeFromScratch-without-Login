import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { PasswordResetEmail } from "@/lib/emails/password-reset";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success } = rateLimit(`forgot-password:${ip}`, 3, 15 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists, a reset link has been sent",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Reset your password",
      html: PasswordResetEmail({ name: user.name || "there", resetUrl }),
    });

    return NextResponse.json({
      message: "If an account exists, a reset link has been sent",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

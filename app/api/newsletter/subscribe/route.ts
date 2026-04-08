import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { NewsletterConfirmEmail } from "@/lib/emails/newsletter-confirm";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success } = rateLimit(`newsletter:${ip}`, 5, 60 * 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing?.confirmed) {
      return NextResponse.json({ message: "Already subscribed" });
    }

    const rawConfirmToken = crypto.randomBytes(32).toString("hex");
    const rawUnsubscribeToken = crypto.randomBytes(32).toString("hex");
    const hashedConfirmToken = crypto.createHash("sha256").update(rawConfirmToken).digest("hex");
    const hashedUnsubscribeToken = crypto.createHash("sha256").update(rawUnsubscribeToken).digest("hex");

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { confirmToken: hashedConfirmToken },
      create: {
        email,
        confirmToken: hashedConfirmToken,
        unsubscribeToken: hashedUnsubscribeToken,
      },
    });

    const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/confirm?token=${rawConfirmToken}`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Confirm your newsletter subscription",
      html: NewsletterConfirmEmail({ confirmUrl }),
    });

    return NextResponse.json({ message: "Confirmation email sent" });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

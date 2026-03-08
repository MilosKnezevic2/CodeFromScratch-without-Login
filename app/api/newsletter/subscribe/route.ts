import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { NewsletterConfirmEmail } from "@/lib/emails/newsletter-confirm";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
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

    const confirmToken = crypto.randomBytes(32).toString("hex");
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { confirmToken },
      create: {
        email,
        confirmToken,
        unsubscribeToken,
      },
    });

    const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/confirm?token=${confirmToken}`;

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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend, getEmailFrom } from "@/lib/resend";
import { NewsletterConfirmEmail } from "@/lib/emails/newsletter-confirm";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

// One neutral reply for every valid address — new, pending, or already
// subscribed. Distinct replies would let anyone probe who is on the list.
const NEUTRAL_MESSAGE =
  "Check your inbox — if this address isn't already subscribed, a confirmation email is on its way.";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success } = rateLimit(`newsletter:${ip}`, 5, 60 * 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    // Honeypot: humans never see this field; bots fill it. Pretend success.
    const honeypot = (body.honeypot ?? "").toString().trim();
    if (honeypot) {
      return NextResponse.json({ message: NEUTRAL_MESSAGE });
    }

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing?.confirmed) {
      // Already on the list — same reply, no email, no information leaked.
      return NextResponse.json({ message: NEUTRAL_MESSAGE });
    }

    // Confirm token: raw goes into the email, only the hash is stored — a DB
    // leak must not let anyone forge consent. The unsubscribe token is stored
    // as sent: campaign emails can only link what the DB holds, and a leaked
    // unsubscribe token can do nothing worse than unsubscribe one address.
    const rawConfirmToken = crypto.randomBytes(32).toString("hex");
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");
    const hashedConfirmToken = crypto.createHash("sha256").update(rawConfirmToken).digest("hex");

    // Re-subscribing while unconfirmed regenerates the token, which also
    // restarts the 7-day confirmation window (updatedAt is the clock).
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { confirmToken: hashedConfirmToken },
      create: {
        email,
        confirmToken: hashedConfirmToken,
        unsubscribeToken,
      },
    });

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const confirmUrl = `${origin}/newsletter/confirm?token=${rawConfirmToken}`;

    await getResend().emails.send({
      from: getEmailFrom(),
      to: email,
      subject: "Confirm your newsletter subscription",
      html: NewsletterConfirmEmail({ confirmUrl }),
    });

    return NextResponse.json({ message: NEUTRAL_MESSAGE });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

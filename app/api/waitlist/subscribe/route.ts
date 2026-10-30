import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getResend, getEmailFrom } from "@/lib/resend";
import { WaitlistConfirmEmail } from "@/lib/emails/waitlist-confirm";
import { AlreadySubscribedEmail } from "@/lib/emails/already-subscribed";
import { rateLimit } from "@/lib/rate-limit";
import { WAITLIST_NOTE_MAX, isWaitlistLevel } from "@/lib/course-waitlist";

// One neutral reply for every valid address, so nobody can probe who is on
// the list.
const NEUTRAL_MESSAGE =
  "Check your inbox. You will get one email either way: a confirmation link, or a note that you are already on the list. If it does not arrive within a few minutes, look in your spam folder.";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success } = rateLimit(`waitlist:${ip}`, 5, 60 * 60 * 1000);
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
    if (!isWaitlistLevel(body.level)) {
      return NextResponse.json({ error: "Please pick your level" }, { status: 400 });
    }
    const note =
      typeof body.note === "string" ? body.note.trim().slice(0, WAITLIST_NOTE_MAX) : "";

    const existing = await prisma.courseWaitlist.findUnique({ where: { email } });
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    if (existing?.confirmed) {
      await getResend().emails.send({
        from: getEmailFrom(),
        to: email,
        subject: "You are already on the course waitlist",
        html: AlreadySubscribedEmail({
          what: "the course waitlist",
          unsubscribeUrl: `${origin}/course-waitlist/unsubscribe?token=${existing.unsubscribeToken}`,
        }),
      });
      return NextResponse.json({ message: NEUTRAL_MESSAGE });
    }

    // Raw token goes into the email, only the hash is stored: a DB leak must
    // not let anyone forge consent. The unsubscribe token is stored as sent.
    const rawConfirmToken = crypto.randomBytes(32).toString("hex");
    const unsubscribeToken = existing?.unsubscribeToken ?? crypto.randomBytes(32).toString("hex");
    const hashedConfirmToken = crypto.createHash("sha256").update(rawConfirmToken).digest("hex");

    await prisma.courseWaitlist.upsert({
      where: { email },
      update: { confirmToken: hashedConfirmToken, level: body.level, note: note || null },
      create: {
        email,
        confirmToken: hashedConfirmToken,
        unsubscribeToken,
        level: body.level,
        note: note || null,
      },
    });

    await getResend().emails.send({
      from: getEmailFrom(),
      to: email,
      subject: "Confirm your place on the course waitlist",
      html: WaitlistConfirmEmail({
        confirmUrl: `${origin}/course-waitlist/confirm?token=${rawConfirmToken}`,
        unsubscribeUrl: `${origin}/course-waitlist/unsubscribe?token=${unsubscribeToken}`,
      }),
    });

    return NextResponse.json({ message: NEUTRAL_MESSAGE });
  } catch (error) {
    console.error("Waitlist subscribe error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

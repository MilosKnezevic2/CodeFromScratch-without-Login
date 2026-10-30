import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL, renderLetter, renderLetterText, REPLY_TO } from "@/lib/emails/newsletter-letter";
import { isValidEmail, parseLetterInput } from "@/lib/newsletter/input";
import { buildLetterContent, sendLetterToOne, sendLetterToRecipients } from "@/lib/newsletter/service";
import { sendEmail } from "@/lib/send-email";

export const maxDuration = 60;

/** A SENDING row younger than this means a send is really still running. */
const SEND_LOCK_MS = 15 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseLetterInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const content = await buildLetterContent(parsed.value);
  if (!content) {
    return NextResponse.json({ error: "That article does not exist." }, { status: 400 });
  }

  if (body.mode === "test") {
    const to = typeof body.testEmail === "string" ? body.testEmail.trim().toLowerCase() : "";
    if (!isValidEmail(to)) {
      return NextResponse.json({ error: "Enter a valid test address." }, { status: 400 });
    }
    const { success } = rateLimit("newsletter-test-send", 20, 60 * 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many test emails. Try again later." }, { status: 429 });
    }

    const testContent = { ...content, subject: `[TEST] ${content.subject}` };
    try {
      // A subscribed test address gets its real link, so unsubscribing can be
      // tried for real. Anyone else gets a link that changes nothing.
      const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { email: to } });
      if (subscriber?.confirmed) {
        await sendLetterToOne(testContent, { email: to, unsubscribeToken: subscriber.unsubscribeToken });
      } else {
        const placeholder = `${SITE_URL()}/newsletter`;
        await sendEmail({
          to,
          subject: testContent.subject,
          html: renderLetter(testContent, placeholder),
          text: renderLetterText(testContent, placeholder),
          replyTo: REPLY_TO,
        });
      }
    } catch (error) {
      console.error("Newsletter test send failed:", error);
      return NextResponse.json({ error: "The test email could not be sent." }, { status: 502 });
    }
    return NextResponse.json({ testSentTo: to });
  }

  if (body.mode !== "all") {
    return NextResponse.json({ error: "Unknown send mode." }, { status: 400 });
  }

  const recipients = await prisma.newsletterSubscriber.findMany({
    where: { confirmed: true },
    select: { email: true, unsubscribeToken: true },
  });
  if (recipients.length === 0) {
    return NextResponse.json({ error: "There are no confirmed subscribers." }, { status: 400 });
  }
  // The admin typed this number after seeing it: a list that changed since then stops the send.
  if (body.confirmCount !== recipients.length) {
    return NextResponse.json(
      {
        error: `The list has ${recipients.length} confirmed subscribers, not ${String(body.confirmCount)}. Check the number and try again.`,
        confirmedCount: recipients.length,
      },
      { status: 409 },
    );
  }

  const now = Date.now();
  const running = await prisma.newsletterCampaign.findFirst({
    where: { status: "SENDING", createdAt: { gt: new Date(now - SEND_LOCK_MS) } },
    select: { id: true },
  });
  if (running) {
    return NextResponse.json({ error: "Another letter is being sent right now." }, { status: 409 });
  }
  const duplicate = await prisma.newsletterCampaign.findFirst({
    where: {
      subject: content.subject,
      status: { in: ["SENT", "PARTIAL"] },
      createdAt: { gt: new Date(now - DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "A letter with this subject already went out in the last 24 hours." },
      { status: 409 },
    );
  }

  const campaign = await prisma.newsletterCampaign.create({
    data: {
      subject: content.subject,
      preheader: content.preheader ?? null,
      note: content.note ?? null,
      postSlug: parsed.value.postSlug || null,
      // Stored for the record only, with a link that does not unsubscribe anyone.
      htmlBody: renderLetter(content, `${SITE_URL()}/newsletter`),
      status: "SENDING",
      recipientCount: recipients.length,
    },
  });

  const { sent, failed } = await sendLetterToRecipients(content, recipients, campaign.id);
  const status = failed === 0 ? "SENT" : sent === 0 ? "FAILED" : "PARTIAL";

  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: { status, sentCount: sent, failedCount: failed, sentAt: new Date() },
  });

  return NextResponse.json({ status, sentCount: sent, failedCount: failed });
}

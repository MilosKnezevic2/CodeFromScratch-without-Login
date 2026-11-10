import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getEmailFrom, getResend } from "@/lib/resend";
import { applicationMessage, applicationSubject, parseApplication } from "@/lib/write-for-us";

/** A pitch from the "Write for us" page: stored in the contact inbox, then emailed to the office. */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`write-for-us:${ip}`, 3, 60 * 60 * 1000).success) {
    return NextResponse.json({ error: "Too many pitches from here. Try again in an hour." }, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "The form could not be read. Reload the page and try again." }, { status: 400 });
  }
  const fields = body as Record<string, unknown>;

  // Bots fill the hidden field; they get a success that stores nothing.
  if (typeof fields.honeypot === "string" && fields.honeypot.trim()) {
    return NextResponse.json({ success: true });
  }

  const parsed = parseApplication(fields);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const app = parsed.value;
  const subject = applicationSubject(app);
  const message = applicationMessage(app);

  try {
    await prisma.contactSubmission.create({ data: { name: app.name, email: app.email, subject, message } });
  } catch (error) {
    console.error("write-for-us: could not store the pitch", error);
    return NextResponse.json({ error: "Your pitch could not be saved. Please try again in a few minutes." }, { status: 503 });
  }

  // The pitch is already in the inbox, so a failed notification only loses the email copy.
  try {
    await getResend().emails.send({
      from: getEmailFrom(),
      to: "office@codefromscratch.org",
      replyTo: app.email,
      subject: `New pitch: ${app.topic}`,
      text: `From: ${app.name} <${app.email}>\n${message}\n\nAlso in the admin inbox (Contacts).`,
    });
  } catch (error) {
    console.error("write-for-us: notification email failed", error);
  }

  return NextResponse.json({ success: true });
}

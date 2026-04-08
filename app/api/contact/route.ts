import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateEmail, validateName, validateMessage, sanitizeInput, sanitizeHtml } from "@/lib/sanitize";
import { resend, EMAIL_FROM } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success } = rateLimit(`contact:${ip}`, 3, 60 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many submissions. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    const honeypot = (body.honeypot ?? "").toString().trim();
    if (honeypot) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const name = sanitizeHtml(sanitizeInput(body.name ?? "", 100));
    const email = sanitizeInput(body.email ?? "", 254).toLowerCase();
    const subject = sanitizeHtml(sanitizeInput(body.subject ?? "", 200));
    const message = sanitizeHtml(sanitizeInput(body.message ?? "", 5000));

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required." },
        { status: 400 }
      );
    }

    if (!validateName(name)) {
      return NextResponse.json(
        { error: "Invalid name format." },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    if (!validateMessage(message)) {
      return NextResponse.json(
        { error: "Message must be between 10 and 5000 characters." },
        { status: 400 }
      );
    }

    const session = await auth();

    await prisma.contactSubmission.create({
      data: {
        name,
        email,
        subject: subject || null,
        message,
        userId: session?.user?.id || null,
      },
    });

    // Send email notification
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: "office@codefromscratch.org",
        subject: `New contact: ${subject || "No subject"}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || "N/A"}\n\nMessage:\n${message}`,
      });
    } catch {
      // Don't fail the request if email fails — submission is already saved
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/contact:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

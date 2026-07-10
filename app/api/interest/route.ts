import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getResend, getEmailFrom } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (!email || !source) {
      return NextResponse.json(
        { error: "Email and source are required" },
        { status: 400 }
      );
    }

    // Reuse the newsletter subscriber table with source in preferences
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      // Update preferences to include the interest source
      const currentPrefs = (existing.preferences as Record<string, unknown>) || {};
      const interests = (currentPrefs.interests as string[]) || [];
      if (!interests.includes(source)) {
        interests.push(source);
      }

      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          preferences: { ...currentPrefs, interests },
        },
      });
    } else {
      await prisma.newsletterSubscriber.create({
        data: {
          email,
          confirmed: true,
          unsubscribeToken: randomUUID(),
          preferences: { interests: [source] },
        },
      });
    }

    // Notify admin
    try {
      await getResend().emails.send({
        from: getEmailFrom(),
        to: "office@codefromscratch.org",
        subject: `New ebook interest: ${source}`,
        text: `Someone signed up for ebook notifications.\n\nEmail: ${email}\nSource: ${source}`,
      });
    } catch {
      // Don't fail if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interest signup error:", error);
    return NextResponse.json(
      { error: "Failed to save interest" },
      { status: 500 }
    );
  }
}

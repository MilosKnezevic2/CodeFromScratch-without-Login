import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { NewsletterCampaignEmail } from "@/lib/emails/newsletter-campaign";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { subject, htmlBody } = await request.json();

  if (!subject || !htmlBody) {
    return NextResponse.json({ error: "Subject and body required" }, { status: 400 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { confirmed: true },
  });

  let sentCount = 0;

  for (const sub of subscribers) {
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: sub.email,
        subject,
        html: NewsletterCampaignEmail({ htmlBody, unsubscribeUrl }),
      });
      sentCount++;
    } catch (error) {
      console.error(`Failed to send to ${sub.email}:`, error);
    }
  }

  await prisma.newsletterCampaign.create({
    data: {
      subject,
      htmlBody,
      sentAt: new Date(),
      sentCount,
    },
  });

  return NextResponse.json({ sentCount });
}

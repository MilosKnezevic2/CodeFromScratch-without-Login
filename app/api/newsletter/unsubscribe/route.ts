import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token");

  if (!rawToken) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/newsletter/unsubscribe?status=error`
    );
  }

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  const subscriber = await prisma.newsletterSubscriber.findFirst({
    where: { unsubscribeToken: hashedToken },
  });

  if (!subscriber) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/newsletter/unsubscribe?status=error`
    );
  }

  await prisma.newsletterSubscriber.delete({
    where: { id: subscriber.id },
  });

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/newsletter/unsubscribe?status=success`
  );
}

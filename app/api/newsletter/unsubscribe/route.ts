import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/newsletter/unsubscribe?status=error`
    );
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
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

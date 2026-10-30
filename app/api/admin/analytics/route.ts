import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalUsers,
    proUsers,
    newsletterTotal,
    newsletterConfirmed,
    ebookPurchases,
    contactMessages,
    unreadMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    prisma.ebookPurchase.count(),
    prisma.contactSubmission.count(),
    prisma.contactSubmission.count({ where: { read: false } }),
  ]);

  return NextResponse.json({
    totalUsers,
    proUsers,
    newsletterTotal,
    newsletterConfirmed,
    ebookPurchases,
    contactMessages,
    unreadMessages,
  });
}

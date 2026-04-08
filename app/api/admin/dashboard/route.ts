import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, subMonths, startOfMonth } from "date-fns";

export async function GET() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);
  const sevenDaysAgo = subDays(now, 7);
  const thisMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subMonths(now, 1));

  const [
    totalUsers,
    usersThisMonth,
    usersLastMonth,
    proSubscriptions,
    activeReaders7d,
    newsletterSubs,
    newsletterSubsLastMonth,
    unreadContacts,
    topPosts,
    recentUsers,
    recentPurchases,
    recentCampaigns,
    planDistribution,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
    prisma.subscription.count({ where: { plan: { not: "FREE" }, status: "ACTIVE" } }),
    prisma.readingHistory.groupBy({
      by: ["userId"],
      where: { readAt: { gte: sevenDaysAgo } },
    }).then((r) => r.length),
    prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    prisma.newsletterSubscriber.count({ where: { confirmed: true, createdAt: { lt: thisMonth } } }),
    prisma.contactSubmission.count({ where: { read: false } }),
    prisma.postView.findMany({
      orderBy: { count: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.ebookPurchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { email: true } }, ebook: { select: { title: true } } },
    }),
    prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { subject: true, sentAt: true, sentCount: true },
    }),
    prisma.subscription.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),
  ]);

  const userGrowth = usersLastMonth > 0
    ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
    : usersThisMonth > 0 ? 100 : 0;

  const newsletterGrowth = newsletterSubsLastMonth > 0
    ? Math.round(((newsletterSubs - newsletterSubsLastMonth) / newsletterSubsLastMonth) * 100)
    : newsletterSubs > 0 ? 100 : 0;

  return NextResponse.json({
    kpis: {
      totalUsers,
      userGrowth,
      proSubscriptions,
      activeReaders7d,
      newsletterSubs,
      newsletterGrowth,
      unreadContacts,
    },
    topPosts,
    recentUsers,
    recentPurchases,
    recentCampaigns,
    planDistribution: planDistribution.map((p) => ({
      plan: p.plan,
      count: p._count.plan,
    })),
  });
}

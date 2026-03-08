import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import StatsCard from "@/components/admin/StatsCard";

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const [
    totalUsers,
    proUsers,
    newUsersThisMonth,
    newsletterSubscribers,
    ebookPurchases,
    contactMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    prisma.ebookPurchase.count(),
    prisma.contactSubmission.count(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Total Users" value={totalUsers} />
        <StatsCard label="Pro Subscribers" value={proUsers} />
        <StatsCard label="New Users (This Month)" value={newUsersThisMonth} />
        <StatsCard label="Newsletter Subscribers" value={newsletterSubscribers} />
        <StatsCard label="Ebook Purchases" value={ebookPurchases} />
        <StatsCard label="Contact Messages" value={contactMessages} />
      </div>
    </div>
  );
}

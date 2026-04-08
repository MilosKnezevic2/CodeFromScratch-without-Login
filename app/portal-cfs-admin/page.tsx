import { prisma } from "@/lib/prisma";
import { subDays, startOfMonth, subMonths } from "date-fns";
import KPICard from "@/components/admin/KPICard";
import Badge from "@/components/admin/Badge";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard | CodeFromScratch",
};

export default async function AdminPage() {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thisMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subMonths(now, 1));

  const [
    totalUsers,
    usersThisMonth,
    usersLastMonth,
    proSubs,
    activeReaders,
    newsletterSubs,
    unreadContacts,
    topPosts,
    recentUsers,
    planDist,
    ebookPurchaseCount,
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
    prisma.contactSubmission.count({ where: { read: false } }),
    prisma.postView.findMany({ orderBy: { count: "desc" }, take: 5 }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, createdAt: true, role: true, subscription: { select: { plan: true } } },
    }),
    prisma.subscription.groupBy({ by: ["plan"], _count: { plan: true } }),
    prisma.ebookPurchase.count(),
  ]);

  const userGrowth = usersLastMonth > 0
    ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
    : usersThisMonth > 0 ? 100 : 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of CodeFromScratch
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Users" value={totalUsers} change={userGrowth} />
        <KPICard label="Pro Subscribers" value={proSubs} prefix="" />
        <KPICard label="Active Readers (7d)" value={activeReaders} />
        <KPICard label="Newsletter Subs" value={newsletterSubs} />
      </div>

      {/* Plan Distribution + Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Plan breakdown */}
        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan Distribution</h3>
          <div className="mt-4 space-y-3">
            {planDist.map((p) => {
              const percent = totalUsers > 0 ? Math.round((p._count.plan / totalUsers) * 100) : 0;
              return (
                <div key={p.plan} className="flex items-center gap-3">
                  <Badge variant={p.plan === "PRO_PLUS" ? "pro-plus" : p.plan.toLowerCase()}>{p.plan}</Badge>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{p._count.plan}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Stats</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New users this month</span>
              <span className="text-sm font-bold text-foreground">{usersThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ebook purchases</span>
              <span className="text-sm font-bold text-foreground">{ebookPurchaseCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unread contacts</span>
              <span className="text-sm font-bold text-accent">{unreadContacts}</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <Link href="/portal-cfs-admin/studio" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface-2 hover:text-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              New Post
            </Link>
            <Link href="/portal-cfs-admin/newsletter" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface-2 hover:text-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              Send Newsletter
            </Link>
            <Link href="/portal-cfs-admin/contacts" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface-2 hover:text-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" /></svg>
              View Messages {unreadContacts > 0 && <Badge variant="pending">{unreadContacts}</Badge>}
            </Link>
          </div>
        </div>
      </div>

      {/* Top Posts */}
      {topPosts.length > 0 && (
        <div className="glow-border overflow-hidden rounded-xl bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Posts by Views</h3>
          </div>
          <div className="divide-y divide-border">
            {topPosts.map((post, i) => (
              <div key={post.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="gradient-text text-lg font-black">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 truncate text-sm font-medium text-foreground">{post.postSlug}</span>
                <span className="text-sm font-semibold text-accent">{post.count.toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Signups */}
      <div className="glow-border overflow-hidden rounded-xl bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Signups</h3>
          <Link href="/portal-cfs-admin/users" className="text-xs font-medium text-accent hover:text-accent-2 transition">
            View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentUsers.map((user) => (
            <Link
              key={user.id}
              href={`/portal-cfs-admin/users/${user.id}`}
              className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface-2/50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{user.name || "Unnamed"}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant={user.role.toLowerCase()}>{user.role}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireAuth();

  const [subscription, savedCount, collectionsCount, ebooksCount] =
    await Promise.all([
      prisma.subscription.findUnique({ where: { userId: user.id } }),
      prisma.savedPost.count({ where: { userId: user.id } }),
      prisma.collection.count({ where: { userId: user.id } }),
      prisma.ebookPurchase.count({ where: { userId: user.id } }),
    ]);

  const stats = [
    {
      label: "Saved Posts",
      value: savedCount,
      href: "/dashboard/saved",
      icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
      color: "from-teal-500/20 to-teal-500/5",
      iconColor: "text-accent",
    },
    {
      label: "Collections",
      value: collectionsCount,
      href: "/dashboard/collections",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "from-cyan-500/20 to-cyan-500/5",
      iconColor: "text-cyan-400",
    },
    {
      label: "Ebooks",
      value: ebooksCount,
      href: "/dashboard/ebooks",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      color: "from-violet-500/20 to-violet-500/5",
      iconColor: "text-violet-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 backdrop-blur-xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user.name || "there"}
            </h1>
            <p className="mt-1 text-muted">
              Here&apos;s an overview of your account
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              subscription?.plan === "PRO"
                ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                : "bg-surface-3/50 text-muted ring-1 ring-border"
            }`}>
              {subscription?.plan || "FREE"} Plan
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur-xl p-6 transition-all duration-300 hover:border-border hover:shadow-[0_0_30px_rgba(45,212,191,0.08)]"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <svg className={`h-8 w-8 ${stat.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
                <svg className="h-5 w-5 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
              <p className="mt-4 text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Upgrade CTA */}
      {subscription?.plan !== "PRO" && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur-xl p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Upgrade to Pro
              </h2>
              <p className="mt-1 text-sm text-muted">
                Get access to premium articles, free ebooks, and more.
              </p>
            </div>
            <Link
              href="/pricing"
              className="cta-glow shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getPostsBySlugList } from "@/lib/sanity/queries";
import { getRecommendationsForUser, getTrendingPosts } from "@/lib/recommendations";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const uniqueDays = [...new Set(dates.map((d) => d.toISOString().split("T")[0]))].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export default async function DashboardPage() {
  const user = await requireAuth();

  const [subscription, savedCount, collectionsCount, ebooksCount, readingHistory] =
    await Promise.all([
      prisma.subscription.findUnique({ where: { userId: user.id } }),
      prisma.savedPost.count({ where: { userId: user.id } }),
      prisma.collection.count({ where: { userId: user.id } }),
      prisma.ebookPurchase.count({ where: { userId: user.id } }),
      prisma.readingHistory.findMany({
        where: { userId: user.id },
        orderBy: { readAt: "desc" },
        take: 20,
      }),
    ]);

  const isPro = subscription?.plan === "PRO" || subscription?.plan === "PRO_PLUS";

  // Fetch recommendations and trending in parallel
  const [recommended, trending] = await Promise.all([
    getRecommendationsForUser(user.id, 4).catch(() => []),
    getTrendingPosts(4).catch(() => []),
  ]);
  const streak = calculateStreak(readingHistory.map((r) => r.readAt));

  // Split into continue reading (incomplete) and recently read (completed)
  const continueReading = readingHistory.filter((r) => !r.completedAt && r.scrollPercent < 90);
  const recentlyRead = readingHistory.filter((r) => r.completedAt || r.scrollPercent >= 90);

  // Batch fetch post data from Sanity
  const allSlugs = readingHistory.map((r) => r.postSlug);
  const postData = allSlugs.length > 0 ? await getPostsBySlugList(allSlugs) : [];
  const postMap = new Map(postData.map((p) => [p.slug.current, p]));

  const interests = (user as unknown as { interests: string[] }).interests;
  const hasInterests = Array.isArray(interests) && interests.length > 0;

  const stats = [
    {
      label: "Saved Posts",
      value: savedCount,
      href: "/dashboard/saved",
      icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
      gradient: "from-teal-500/15 to-cyan-500/5",
      iconBg: "bg-teal-500/10",
      iconColor: "text-teal-400",
    },
    {
      label: "Collections",
      value: collectionsCount,
      href: "/dashboard/collections",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      gradient: "from-cyan-500/15 to-blue-500/5",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
    },
    {
      label: "Articles Read",
      value: recentlyRead.length,
      href: "/dashboard/history",
      icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
      gradient: "from-violet-500/15 to-purple-500/5",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-accent-2/5 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                <span className="text-xl font-bold text-accent">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome back, {user.name || "there"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Here&apos;s an overview of your account
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-400 ring-1 ring-orange-500/20">
                🔥 {streak} day streak
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                isPro
                  ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                  : "bg-surface-2 text-muted-foreground ring-1 ring-border"
              }`}
            >
              {isPro && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
              )}
              {subscription?.plan || "FREE"} Plan
            </span>
          </div>
        </div>
      </div>

      {/* Personalize CTA */}
      {!hasInterests && (
        <Link
          href="/onboarding"
          className="group flex items-center gap-4 rounded-2xl border border-accent/20 bg-accent/5 p-5 transition hover:bg-accent/10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Personalize your experience</p>
            <p className="text-xs text-muted-foreground">Pick your topics to get tailored recommendations</p>
          </div>
          <svg className="h-4 w-4 text-accent transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}

      {/* Continue Reading */}
      {continueReading.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Continue Reading
          </h2>
          <div className="space-y-3">
            {continueReading.slice(0, 3).map((item) => {
              const post = postMap.get(item.postSlug);
              if (!post) return null;
              return (
                <Link
                  key={item.id}
                  href={`/blog/${item.postSlug}`}
                  className="group flex gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-accent/20"
                >
                  {post.featuredImage?.asset && (
                    <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
                      <Image
                        src={urlFor(post.featuredImage).width(96).height(64).quality(75).url()}
                        alt={post.title}
                        width={96}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-accent transition">
                      {post.title}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all"
                          style={{ width: `${item.scrollPercent}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.scrollPercent}%
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-accent/20 hover:shadow-[0_0_40px_rgba(45,212,191,0.06)]"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}>
                  <svg className={`h-5 w-5 ${stat.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                  </svg>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition group-hover:border-accent/30 group-hover:bg-accent/5">
                  <svg className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
              <p className="mt-5 text-3xl font-extrabold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recommended for You */}
      {recommended.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Recommended for You
            </h2>
            <Link href="/blog" className="text-xs font-medium text-accent hover:text-accent-2 transition">
              See all →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommended.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug.current}`}
                className="group flex gap-3 rounded-xl border border-border bg-surface p-3 transition hover:border-accent/20"
              >
                {post.featuredImage?.asset && (
                  <div className="hidden h-14 w-20 shrink-0 overflow-hidden rounded-lg sm:block">
                    <Image
                      src={urlFor(post.featuredImage).width(80).height(56).quality(75).url()}
                      alt={post.title}
                      width={80}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-accent transition">
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {post.categories?.[0]?.title}{post.readingTime ? ` · ${post.readingTime} min` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending This Week */}
      {trending.length > 0 && recommended.length === 0 && (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Trending This Week
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {trending.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug.current}`}
                className="group flex gap-3 rounded-xl border border-border bg-surface p-3 transition hover:border-accent/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-accent transition">
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {post.categories?.[0]?.title}{post.readingTime ? ` · ${post.readingTime} min` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/blog"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Browse Articles</p>
            <p className="text-xs text-muted-foreground">Discover new tutorials and guides</p>
          </div>
          <svg className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
        <Link
          href="/dashboard/profile"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Edit Profile</p>
            <p className="text-xs text-muted-foreground">Update your name and settings</p>
          </div>
          <svg className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* Upgrade CTA */}
      {!isPro && (
        <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-surface p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/8 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Upgrade to Pro</h2>
                <p className="text-sm text-muted-foreground">
                  Unlock premium articles, free ebooks, and exclusive content.
                </p>
              </div>
            </div>
            <Link href="/pricing" className="cta-glow shrink-0 rounded-xl px-6 py-3 text-sm font-bold">
              View Plans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

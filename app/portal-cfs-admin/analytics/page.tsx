import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";
import { subDays, startOfMonth, subMonths, differenceInMinutes } from "date-fns";
import KPICard from "@/components/admin/KPICard";
import Badge from "@/components/admin/Badge";

interface SanityPostMeta {
  title: string;
  slug: { current: string };
  readingTime?: number;
  categories?: { title: string; slug: { current: string } }[];
  tags?: { title: string; slug: { current: string } }[];
}

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);
  const thisMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subMonths(now, 1));

  // Fetch everything in parallel
  const [
    totalUsers,
    usersThisMonth,
    usersLastMonth,
    activeReaders7d,
    activeReaders30d,
    allReadingHistory,
    postViews,
    reactionsByPost,
    reactionsByType,
    savedByPost,
    totalSaves,
    totalReactions,
    totalCompleted,
    sanityPosts,
    topReaders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
    prisma.readingHistory.groupBy({ by: ["userId"], where: { readAt: { gte: sevenDaysAgo } } }).then((r) => r.length),
    prisma.readingHistory.groupBy({ by: ["userId"], where: { readAt: { gte: thirtyDaysAgo } } }).then((r) => r.length),
    prisma.readingHistory.findMany({
      select: { postSlug: true, scrollPercent: true, completedAt: true, readAt: true, userId: true },
    }),
    prisma.postView.findMany({ orderBy: { count: "desc" } }),
    prisma.postReaction.groupBy({ by: ["postSlug"], _count: { postSlug: true } }),
    prisma.postReaction.groupBy({ by: ["type"], _count: { type: true } }),
    prisma.savedPost.groupBy({ by: ["postSlug"], _count: { postSlug: true } }),
    prisma.savedPost.count(),
    prisma.postReaction.count(),
    prisma.readingHistory.count({ where: { completedAt: { not: null } } }),
    client.fetch<SanityPostMeta[]>(
      `*[_type == "post" && status == "published"] { title, slug, readingTime, categories[]->{ title, slug }, tags[]->{ title, slug } }`
    ).catch(() => [] as SanityPostMeta[]),
    prisma.readingHistory.groupBy({
      by: ["userId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
  ]);

  // Build lookup maps
  const postMap = new Map(sanityPosts.map((p) => [p.slug.current, p]));
  const viewMap = new Map(postViews.map((v) => [v.postSlug, v.count]));
  const reactionMap = new Map(reactionsByPost.map((r) => [r.postSlug, r._count.postSlug]));
  const saveMap = new Map(savedByPost.map((s) => [s.postSlug, s._count.postSlug]));

  // Calculate per-post analytics
  const readingByPost = new Map<string, { totalReads: number; totalScroll: number; completed: number; estimatedMinutes: number }>();
  for (const r of allReadingHistory) {
    const existing = readingByPost.get(r.postSlug) || { totalReads: 0, totalScroll: 0, completed: 0, estimatedMinutes: 0 };
    existing.totalReads++;
    existing.totalScroll += r.scrollPercent;
    if (r.completedAt) existing.completed++;
    const meta = postMap.get(r.postSlug);
    if (meta?.readingTime) {
      existing.estimatedMinutes += Math.round(meta.readingTime * (r.scrollPercent / 100));
    }
    readingByPost.set(r.postSlug, existing);
  }

  // Build post performance table
  const postPerformance = sanityPosts.map((post) => {
    const slug = post.slug.current;
    const reading = readingByPost.get(slug);
    const views = viewMap.get(slug) || 0;
    const reactions = reactionMap.get(slug) || 0;
    const saves = saveMap.get(slug) || 0;
    const avgScroll = reading ? Math.round(reading.totalScroll / reading.totalReads) : 0;
    const completionRate = reading && reading.totalReads > 0 ? Math.round((reading.completed / reading.totalReads) * 100) : 0;
    const totalMinutes = reading?.estimatedMinutes || 0;

    return { title: post.title, slug, categories: post.categories, tags: post.tags, views, reactions, saves, avgScroll, completionRate, totalMinutes, readingTime: post.readingTime };
  }).sort((a, b) => b.views - a.views);

  // Category analytics
  const categoryStats = new Map<string, { views: number; posts: number; reactions: number; saves: number; minutes: number }>();
  for (const post of postPerformance) {
    for (const cat of post.categories || []) {
      const existing = categoryStats.get(cat.title) || { views: 0, posts: 0, reactions: 0, saves: 0, minutes: 0 };
      existing.views += post.views;
      existing.posts++;
      existing.reactions += post.reactions;
      existing.saves += post.saves;
      existing.minutes += post.totalMinutes;
      categoryStats.set(cat.title, existing);
    }
  }
  const categoryRanking = [...categoryStats.entries()].sort((a, b) => b[1].views - a[1].views);

  // Tag analytics
  const tagStats = new Map<string, { views: number; posts: number }>();
  for (const post of postPerformance) {
    for (const tag of post.tags || []) {
      const existing = tagStats.get(tag.title) || { views: 0, posts: 0 };
      existing.views += post.views;
      existing.posts++;
      tagStats.set(tag.title, existing);
    }
  }
  const tagRanking = [...tagStats.entries()].sort((a, b) => b[1].views - a[1].views).slice(0, 15);

  // Total reading time
  const totalReadingMinutes = [...readingByPost.values()].reduce((sum, r) => sum + r.estimatedMinutes, 0);
  const totalReadingHours = Math.round(totalReadingMinutes / 60);
  const avgScrollOverall = allReadingHistory.length > 0 ? Math.round(allReadingHistory.reduce((s, r) => s + r.scrollPercent, 0) / allReadingHistory.length) : 0;

  // User growth
  const userGrowth = usersLastMonth > 0 ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100) : 0;

  // Top readers — get user info
  const topReaderIds = topReaders.map((r) => r.userId);
  const topReaderUsers = topReaderIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: topReaderIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const readerUserMap = new Map(topReaderUsers.map((u) => [u.id, u]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Deep insights into your content and audience</p>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Users" value={totalUsers} change={userGrowth} />
        <KPICard label="Active Readers (7d)" value={activeReaders7d} />
        <KPICard label="Total Reading Time" value={`${totalReadingHours}h`} />
        <KPICard label="Avg Scroll Depth" value={`${avgScrollOverall}%`} />
      </div>

      {/* Engagement overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glow-border rounded-xl bg-surface p-4 text-center">
          <p className="text-2xl font-extrabold text-foreground">{totalReactions}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Reactions</p>
        </div>
        <div className="glow-border rounded-xl bg-surface p-4 text-center">
          <p className="text-2xl font-extrabold text-foreground">{totalSaves}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Saves</p>
        </div>
        <div className="glow-border rounded-xl bg-surface p-4 text-center">
          <p className="text-2xl font-extrabold text-foreground">{totalCompleted}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Articles Completed</p>
        </div>
        <div className="glow-border rounded-xl bg-surface p-4 text-center">
          <p className="text-2xl font-extrabold text-foreground">{activeReaders30d}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Readers (30d)</p>
        </div>
      </div>

      {/* Reaction breakdown */}
      <div className="glow-border rounded-xl bg-surface p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reaction Breakdown</h3>
        <div className="mt-4 flex flex-wrap gap-4">
          {reactionsByType.map((r) => {
            const emoji = r.type === "helpful" ? "👍" : r.type === "love" ? "❤️" : r.type === "insightful" ? "💡" : "🚀";
            return (
              <div key={r.type} className="flex items-center gap-2 rounded-lg bg-surface-2/50 px-4 py-2.5">
                <span className="text-lg">{emoji}</span>
                <div>
                  <p className="text-sm font-bold text-foreground">{r._count.type}</p>
                  <p className="text-[10px] capitalize text-muted-foreground">{r.type}</p>
                </div>
              </div>
            );
          })}
          {reactionsByType.length === 0 && <p className="text-sm text-muted-foreground">No reactions yet</p>}
        </div>
      </div>

      {/* Post performance table */}
      <div className="glow-border overflow-hidden rounded-xl bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Post Performance ({postPerformance.length} posts)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Post</th>
                <th className="px-3 py-3 font-semibold text-right">Views</th>
                <th className="px-3 py-3 font-semibold text-right">Avg Scroll</th>
                <th className="px-3 py-3 font-semibold text-right">Completion</th>
                <th className="px-3 py-3 font-semibold text-right">Time (est.)</th>
                <th className="px-3 py-3 font-semibold text-right">Reactions</th>
                <th className="px-3 py-3 font-semibold text-right">Saves</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {postPerformance.slice(0, 20).map((post, i) => (
                <tr key={post.slug} className="transition hover:bg-surface-2/30">
                  <td className="max-w-[280px] px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="gradient-text text-xs font-black">{String(i + 1).padStart(2, "0")}</span>
                      <span className="truncate font-medium text-foreground">{post.title}</span>
                    </div>
                    {post.categories?.[0] && (
                      <span className="text-[10px] text-accent">{post.categories[0].title}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-foreground">{post.views.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${post.avgScroll}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{post.avgScroll}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-xs font-semibold ${post.completionRate >= 70 ? "text-green-400" : post.completionRate >= 40 ? "text-yellow-400" : "text-muted-foreground"}`}>
                      {post.completionRate}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                    {post.totalMinutes > 60 ? `${Math.round(post.totalMinutes / 60)}h` : `${post.totalMinutes}m`}
                  </td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{post.reactions}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{post.saves}</td>
                </tr>
              ))}
              {postPerformance.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No published posts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category + Tag analytics side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Categories */}
        <div className="glow-border overflow-hidden rounded-xl bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Performance</h3>
          </div>
          <div className="divide-y divide-border">
            {categoryRanking.map(([name, stats]) => (
              <div key={name} className="flex items-center gap-4 px-5 py-3">
                <span className="text-sm font-semibold text-accent">{name}</span>
                <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{stats.posts} posts</span>
                  <span className="font-semibold text-foreground">{stats.views.toLocaleString()} views</span>
                  <span>{stats.reactions} reactions</span>
                  <span>{stats.saves} saves</span>
                  <span>{stats.minutes > 60 ? `${Math.round(stats.minutes / 60)}h` : `${stats.minutes}m`} read</span>
                </div>
              </div>
            ))}
            {categoryRanking.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No category data</div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="glow-border overflow-hidden rounded-xl bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Tags</h3>
          </div>
          <div className="divide-y divide-border">
            {tagRanking.map(([name, stats]) => (
              <div key={name} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-foreground">{name}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{stats.posts} posts</span>
                  <span className="font-semibold text-foreground">{stats.views.toLocaleString()} views</span>
                </div>
              </div>
            ))}
            {tagRanking.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No tag data</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Readers */}
      <div className="glow-border overflow-hidden rounded-xl bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Readers</h3>
        </div>
        <div className="divide-y divide-border">
          {topReaders.map((reader, i) => {
            const user = readerUserMap.get(reader.userId);
            return (
              <div key={reader.userId} className="flex items-center gap-4 px-5 py-3">
                <span className="gradient-text text-sm font-black">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                  {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user?.name || "Unnamed"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <span className="text-sm font-bold text-accent">{reader._count.userId} articles</span>
              </div>
            );
          })}
          {topReaders.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No reading data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

function calculateStreak(dates: Date[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };
  const uniqueDays = [...new Set(dates.map((d) => d.toISOString().split("T")[0]))].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Current streak
  let current = 0;
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      if ((prev.getTime() - curr.getTime()) / 86400000 === 1) current++;
      else break;
    }
  }

  // Longest streak
  let longest = 1;
  let run = 1;
  const sorted = [...uniqueDays].sort();
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    if ((curr.getTime() - prev.getTime()) / 86400000 === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return { current, longest };
}

export default async function ReadingStatsPage() {
  const user = await requireAuth();

  const history = await prisma.readingHistory.findMany({
    where: { userId: user.id },
    select: { readAt: true, completedAt: true, scrollPercent: true },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalRead = history.filter((h) => h.completedAt || h.scrollPercent >= 90).length;
  const thisMonth = history.filter((h) => h.readAt >= monthStart).length;
  const streaks = calculateStreak(history.map((h) => h.readAt));

  const stats = [
    { label: "Current Streak", value: `${streaks.current}`, unit: "days", icon: "🔥", color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Longest Streak", value: `${streaks.longest}`, unit: "days", icon: "🏆", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Articles Completed", value: `${totalRead}`, unit: "total", icon: "📚", color: "text-teal-400", bg: "bg-teal-500/10" },
    { label: "This Month", value: `${thisMonth}`, unit: "articles", icon: "📅", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reading Stats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your reading progress and streaks.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div>
                <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.unit} · {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalRead === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-lg font-semibold text-foreground">Start your reading journey!</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Read articles to build your streak and track your progress.
          </p>
          <a
            href="/blog"
            className="mt-4 inline-block rounded-lg bg-accent/10 px-5 py-2 text-sm font-medium text-accent transition hover:bg-accent/20"
          >
            Browse Articles
          </a>
        </div>
      )}
    </div>
  );
}

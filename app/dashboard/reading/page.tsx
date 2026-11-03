import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDuration, READ_AT_PERCENT } from "@/lib/reader/rules";
import { requireReader } from "@/lib/reader/session";
import { getPostCards } from "@/lib/sanity/queries";
import { clearHistoryAction, setTrackingAction } from "../actions";

export const metadata: Metadata = {
  title: "Your reading",
  robots: { index: false, follow: false },
};

export default async function ReadingPage() {
  const reader = await requireReader("/dashboard/reading");
  const [user, history] = await Promise.all([
    prisma.user.findUnique({ where: { id: reader.id }, select: { trackReading: true } }),
    prisma.readingHistory.findMany({
      where: { userId: reader.id },
      orderBy: { readAt: "desc" },
      take: 300,
      select: { postSlug: true, scrollPercent: true, secondsRead: true, completedAt: true, readAt: true },
    }),
  ]);
  const cards = await getPostCards(history.map((h) => h.postSlug));
  const tracking = user?.trackReading ?? true;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Reading</h1>
        <p className="mt-2 text-sm text-muted">
          Every article you opened while logged in: how far you got and how long it was on your screen.
        </p>
      </div>

      <section aria-label="Tracking" className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="flex-1 text-muted">
          {tracking
            ? "Tracking is on. Only you see this, and only while you are logged in."
            : "Tracking is off: nothing new is recorded. What is below stays until you delete it."}
        </p>
        <form action={setTrackingAction}>
          <input type="hidden" name="track" value={tracking ? "off" : "on"} />
          <button type="submit" className="min-h-11 rounded-lg border border-border px-4 font-semibold text-foreground hover:border-accent/40">
            {tracking ? "Turn tracking off" : "Turn tracking on"}
          </button>
        </form>
        {history.length > 0 && (
          <form action={clearHistoryAction}>
            <button type="submit" className="min-h-11 rounded-lg border border-red-500/40 px-4 font-semibold text-red-400 hover:bg-red-500/10">
              Delete reading history
            </button>
          </form>
        )}
      </section>

      {history.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing yet. <Link href="/blog" className="text-accent underline underline-offset-2">Open an article</Link> and it appears here.
        </p>
      ) : (
        <ul className="space-y-3">
          {history.map((h) => {
            const card = cards.get(h.postSlug);
            const done = Boolean(h.completedAt) || h.scrollPercent >= READ_AT_PERCENT;
            return (
              <li key={h.postSlug} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  {card ? (
                    <Link href={`/blog/${h.postSlug}`} className="font-semibold text-foreground hover:text-accent">
                      {card.title}
                    </Link>
                  ) : (
                    <span className="font-semibold text-muted-foreground">{h.postSlug} (no longer published)</span>
                  )}
                  <span className={`rounded px-2 py-0.5 text-xs ${done ? "bg-emerald-500/20 text-foreground" : "bg-surface-2 text-muted-foreground"}`}>
                    {done ? "Read" : "In progress"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${h.scrollPercent}% read`}>
                    <div className="h-1.5 rounded-full bg-accent" style={{ width: `${h.scrollPercent}%` }} />
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {h.scrollPercent}% · {formatDuration(h.secondsRead)} · {h.readAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

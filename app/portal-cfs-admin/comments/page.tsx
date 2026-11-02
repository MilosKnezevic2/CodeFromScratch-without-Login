import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings/store";
import { moderateAction } from "./actions";

export const metadata: Metadata = {
  title: "Comments",
  robots: { index: false, follow: false },
};

const when = (value: Date) =>
  value.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Decision({ id, decision, label, tone }: { id: string; decision: string; label: string; tone: "ok" | "plain" | "danger" }) {
  const cls =
    tone === "ok"
      ? "bg-accent text-accent-foreground"
      : tone === "danger"
        ? "border border-red-500/40 text-red-400 hover:bg-red-500/10"
        : "border border-border text-foreground hover:border-accent/40";
  return (
    <form action={moderateAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      <button type="submit" className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition ${cls}`}>
        {label}
      </button>
    </form>
  );
}

export default async function AdminCommentsPage() {
  const [{ features }, waiting, recent] = await Promise.all([
    getSettings(),
    prisma.postComment
      .findMany({
        where: { status: "PENDING", deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: { id: true, postSlug: true, body: true, reportedCount: true, createdAt: true, user: { select: { name: true, email: true } } },
      })
      .catch(() => null),
    prisma.postComment
      .findMany({
        where: { status: "APPROVED", deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, postSlug: true, body: true, reportedCount: true, createdAt: true, user: { select: { name: true, email: true } } },
      })
      .catch(() => null),
  ]);

  if (!waiting || !recent) {
    return <p className="text-muted">The database did not answer. It may be waking up; reload in a minute.</p>;
  }

  const open = features.commentsEnabled && features.registrationOpen;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comments</h1>
        <p className="mt-1 text-sm text-muted">
          {open ? "Comments are on." : "Comments are off for readers."} A reader&rsquo;s first comment waits here; once one is
          approved, the next ones go live at once. Three reports send a published comment back here. Switches:{" "}
          <Link href="/portal-cfs-admin/settings?tab=features" className="text-accent underline-offset-2 hover:underline">
            Settings &gt; Features
          </Link>
          .
        </p>
      </div>

      <section aria-labelledby="waiting-heading">
        <h2 id="waiting-heading" className="text-lg font-semibold text-foreground">
          Waiting for approval ({waiting.length})
        </h2>
        {waiting.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing waiting.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {waiting.map((c) => (
              <li key={c.id} className="rounded-xl border border-accent/30 bg-surface p-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{c.user.name ?? "Reader"}</span> ({c.user.email}) on{" "}
                  <Link href={`/blog/${c.postSlug}#comments`} className="text-accent underline-offset-2 hover:underline">
                    {c.postSlug}
                  </Link>{" "}
                  · {when(c.createdAt)}
                  {c.reportedCount > 0 && <span className="ml-2 text-red-400">reported {c.reportedCount}×</span>}
                </p>
                <p className="mt-2 whitespace-pre-line break-words text-sm text-foreground">{c.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Decision id={c.id} decision="approve" label="Approve" tone="ok" />
                  <Decision id={c.id} decision="reject" label="Reject" tone="plain" />
                  <Decision id={c.id} decision="ban" label="Spam: block this reader" tone="danger" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-lg font-semibold text-foreground">
          Recently published
        </h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No published comments yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {recent.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{c.user.name ?? "Reader"}</span> ({c.user.email}) on{" "}
                  <Link href={`/blog/${c.postSlug}#comments`} className="text-accent underline-offset-2 hover:underline">
                    {c.postSlug}
                  </Link>{" "}
                  · {when(c.createdAt)}
                </p>
                <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-sm text-foreground">{c.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Decision id={c.id} decision="delete" label="Remove" tone="plain" />
                  <Decision id={c.id} decision="ban" label="Block this reader" tone="danger" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

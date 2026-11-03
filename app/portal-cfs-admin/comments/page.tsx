import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings/store";
import { approveAllAction, moderateAction, removeAvatarAction } from "./actions";

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
  const [{ features }, waiting, recent, pictures] = await Promise.all([
    getSettings(),
    prisma.postComment
      .findMany({
        where: { status: "PENDING", deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true,
          postSlug: true,
          body: true,
          reportedCount: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          parent: { select: { body: true, user: { select: { name: true } } } },
        },
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
    prisma.userAvatar
      .findMany({
        orderBy: { updatedAt: "desc" },
        take: 60,
        select: { userId: true, updatedAt: true, user: { select: { name: true, email: true, image: true } } },
      })
      .catch(() => null),
  ]);

  if (!waiting || !recent || !pictures) {
    return <p className="text-muted">The database did not answer. It may be waking up; reload in a minute.</p>;
  }

  const open = features.commentsEnabled && features.registrationOpen;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comments</h1>
        <p className="mt-1 text-sm text-muted">
          {open ? "Comments are on." : "Comments are off for readers."}{" "}
          {features.holdFirstComment
            ? "Only a reader's first comment waits here; once you approve one, their next comments go live at once."
            : "Comments go live at once; only link-heavy ones wait here."}{" "}
          Three reports send a published comment back here. Switches:{" "}
          <Link href="/portal-cfs-admin/settings?tab=features" className="text-accent underline-offset-2 hover:underline">
            Settings &gt; Features
          </Link>
          .
        </p>
      </div>

      <section aria-labelledby="waiting-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="waiting-heading" className="text-lg font-semibold text-foreground">
            Waiting for approval ({waiting.length})
          </h2>
          {waiting.length > 1 && (
            <form action={approveAllAction}>
              <button type="submit" className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:border-accent/40">
                Approve all {waiting.length}
              </button>
            </form>
          )}
        </div>
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
                {c.parent && (
                  <p className="mt-2 line-clamp-2 border-l-2 border-border pl-3 text-xs text-muted-foreground">
                    Reply to {c.parent.user.name ?? "a reader"}: {c.parent.body}
                  </p>
                )}
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

      <section aria-labelledby="pictures-heading">
        <h2 id="pictures-heading" className="text-lg font-semibold text-foreground">
          Uploaded profile pictures ({pictures.length})
        </h2>
        <p className="mt-1 text-sm text-muted">
          Pictures readers uploaded themselves, newest first. They show next to comments. Removing one puts back the reader&rsquo;s Google or GitHub picture
          (or their initial); the reader can upload again, so block a reader who keeps doing it.
        </p>
        {pictures.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No uploaded pictures.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {pictures.map((p) => (
              <li key={p.userId} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 text-center">
                {p.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- a 256 px picture served by our own /api/avatar route
                  <img src={p.user.image} alt={`Profile picture of ${p.user.name ?? p.user.email}`} width={96} height={96} className="h-24 w-24 rounded-full object-cover" />
                )}
                <p className="w-full truncate text-xs font-semibold text-foreground">{p.user.name ?? "Reader"}</p>
                <p className="w-full truncate text-[11px] text-muted-foreground">{p.user.email}</p>
                <p className="text-[11px] text-muted-foreground">{when(p.updatedAt)}</p>
                <form action={removeAvatarAction}>
                  <input type="hidden" name="userId" value={p.userId} />
                  <button type="submit" className="min-h-9 rounded-lg border border-red-500/40 px-3 text-xs font-semibold text-red-400 transition hover:bg-red-500/10">
                    Remove picture
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

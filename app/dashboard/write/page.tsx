import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAuthor, listOwnDrafts } from "@/lib/writer/drafts";
import { STATUS_LABEL } from "@/lib/writer/status";
import { Eyebrow, SectionCard } from "../_ui/parts";
import { newDraftAction } from "./actions";

export const metadata: Metadata = {
  title: "Your articles",
  robots: { index: false, follow: false },
};

const when = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** The author's desk: their own drafts only. Everyone else gets a 404, as if the page did not exist. */
export default async function WriterDeskPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const author = await currentAuthor();
  if (!author) notFound();
  const [drafts, { error }] = await Promise.all([listOwnDrafts(author.id), searchParams]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Your articles</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Write here and send the article for review when it is ready. Milos reads it, and publishing is his step:
            nothing you write goes live without his review.
          </p>
        </div>
        <form action={newDraftAction}>
          <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground transition hover:opacity-90 active:scale-[0.98]">
            <span aria-hidden="true">+</span> New article
          </button>
        </form>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {drafts.length === 0 ? (
        <SectionCard className="text-center">
          <p className="text-lg font-bold text-foreground">No articles yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Start with the outline you agreed with Milos. The editor shows a live preview next to what you type, exactly as the
            article will look on the site.
          </p>
        </SectionCard>
      ) : (
        <ul className="space-y-3">
          {drafts.map((d) => {
            const status = STATUS_LABEL[d.status];
            return (
              <li key={d.id}>
                <Link
                  href={`/write/${d.id}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground group-hover:text-accent">{d.title || "Untitled article"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last saved {when(d.updatedAt)}
                      {d.submittedAt && ` · sent ${when(d.submittedAt)}`}
                    </p>
                    {d.status === "CHANGES_REQUESTED" && d.reviewNote && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">
                        <span className="font-semibold text-foreground">Editor: </span>
                        {d.reviewNote}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 self-start rounded-full px-3 py-1 text-xs font-bold sm:self-center ${status.tone}`}>{status.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <SectionCard>
        <Eyebrow>How it works</Eyebrow>
        <ol className="mt-3 grid gap-3 text-sm text-muted sm:grid-cols-3">
          <li>
            <span className="font-bold text-foreground">1. Write.</span> Every change saves on its own. The preview is the real
            article layout.
          </li>
          <li>
            <span className="font-bold text-foreground">2. Send for review.</span> The draft locks while Milos reads it.
          </li>
          <li>
            <span className="font-bold text-foreground">3. Edit or publish.</span> Either it comes back with notes, or Milos
            publishes it under your name.
          </li>
        </ol>
      </SectionCard>
    </div>
  );
}

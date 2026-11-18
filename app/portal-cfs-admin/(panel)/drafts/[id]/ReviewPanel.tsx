"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DraftStatusName } from "@/lib/writer/status";
import { approveAction, requestChangesAction, type ReviewResult } from "../actions";

/** The editor's decision on a sent draft. */
export default function ReviewPanel({ id, status, reviewNote }: { id: string; status: DraftStatusName; reviewNote: string | null }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<ReviewResult>) {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  if (status !== "IN_REVIEW") {
    return (
      <aside className="h-fit rounded-xl border border-border bg-surface p-5 text-sm text-muted xl:sticky xl:top-6">
        {status === "APPROVED" ? (
          <>
            <p className="font-semibold text-foreground">Approved</p>
            <p className="mt-1">In the full version this creates the article in Sanity, unpublished, for the usual checks and the publish step.</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-foreground">Sent back to the author</p>
            {reviewNote && <p className="mt-2 whitespace-pre-line">{reviewNote}</p>}
          </>
        )}
      </aside>
    );
  }

  return (
    <aside className="h-fit space-y-4 rounded-xl border border-border bg-surface p-5 xl:sticky xl:top-6">
      <p className="font-semibold text-foreground">Your decision</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => approveAction(id))}
        className="min-h-11 w-full rounded-lg bg-accent text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        Approve
      </button>
      <div className="border-t border-border pt-4">
        <label htmlFor="review-note" className="text-sm font-semibold text-foreground">
          Or send it back with notes
        </label>
        <textarea
          id="review-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={6}
          maxLength={5000}
          placeholder="What should change before it can be published?"
          className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => requestChangesAction(id, note))}
          className="mt-2 min-h-11 w-full rounded-lg border border-border text-sm font-semibold text-foreground transition hover:border-accent/40 disabled:opacity-60"
        >
          Request changes
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-400">
          {error}
        </p>
      )}
    </aside>
  );
}

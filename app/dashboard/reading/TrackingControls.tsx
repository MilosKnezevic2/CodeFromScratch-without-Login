"use client";

import { useState, useTransition } from "react";
import { clearHistory, setTracking } from "../actions";

export default function TrackingControls({ tracking, hasHistory }: { tracking: boolean; hasHistory: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => void (await setTracking(!tracking)))}
        className="min-h-11 rounded-xl border border-border px-4 font-bold text-foreground transition hover:border-accent/50 disabled:opacity-50"
      >
        {tracking ? "Turn tracking off" : "Turn tracking on"}
      </button>
      {hasHistory &&
        (confirming ? (
          <>
            <span className="text-foreground">Delete all reading history?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await clearHistory();
                  setConfirming(false);
                })
              }
              className="min-h-11 rounded-xl border border-red-400 px-4 font-bold text-red-600 disabled:opacity-50 dark:text-red-300"
            >
              Delete
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="min-h-11 px-2 text-muted">
              Keep it
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-xl px-3 text-muted transition hover:text-red-500">
            Delete history
          </button>
        ))}
    </div>
  );
}

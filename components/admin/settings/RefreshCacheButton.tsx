"use client";

import { useState, useTransition } from "react";
import { refreshCacheAction } from "@/app/portal-cfs-admin/settings/actions";

/** Rebuilds every public page on its next visit, for when something looks stale. */
export default function RefreshCacheButton() {
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setMessage((await refreshCacheAction()).message))}
        className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2 disabled:opacity-60"
      >
        {pending ? "Refreshing…" : "Refresh the public site"}
      </button>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

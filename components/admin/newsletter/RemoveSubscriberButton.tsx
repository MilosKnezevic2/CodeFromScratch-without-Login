"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveSubscriberButton({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers/${id}`, { method: "DELETE" });
      // 404 means it is already gone, which is what was asked for.
      if (res.ok || res.status === 404) {
        dialogRef.current?.close();
        router.refresh();
        return;
      }
      setError("Could not remove this address. Log in again and retry.");
    } catch {
      setError("Network error. Try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Unsubscribe ${email}`}
        className="min-h-11 rounded-lg border border-border px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
      >
        Unsubscribe
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`remove-title-${id}`}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-6 text-left text-foreground backdrop:bg-black/60"
      >
        <h2 id={`remove-title-${id}`} className="text-lg font-bold">
          Unsubscribe this address?
        </h2>
        <p className="mt-2 break-all text-sm text-muted">{email}</p>
        <p className="mt-3 text-sm text-muted">
          The address is deleted from the list right away and gets no email about it. This cannot be
          undone. They can only come back by signing up and confirming again.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={busy}
            className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="min-h-11 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Removing…" : "Unsubscribe"}
          </button>
        </div>
      </dialog>
    </>
  );
}

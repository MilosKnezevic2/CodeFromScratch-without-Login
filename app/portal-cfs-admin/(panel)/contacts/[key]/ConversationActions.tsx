"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteConversationAction, markUnreadAction, setDoneAction } from "../actions";

const button =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const plain = `${button} border border-border text-foreground hover:border-accent/50`;

/** Done, unread and delete for one conversation. Delete asks a second time. */
export default function ConversationActions({ conversationKey, address, done }: { conversationKey: string; address: string; done: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (task: () => Promise<{ ok: boolean; error?: string } | void>, then?: () => void) =>
    startTransition(async () => {
      setError(null);
      const result = await task();
      if (result && !result.ok) setError(result.error ?? "That did not work. Try again.");
      else then?.();
    });

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={plain} disabled={pending} onClick={() => run(() => setDoneAction(conversationKey, !done), () => router.push("/portal-cfs-admin/contacts"))}>
          {done ? "Back to inbox" : "Done"}
        </button>
        <button type="button" className={plain} disabled={pending} onClick={() => run(() => markUnreadAction(conversationKey, address), () => router.push("/portal-cfs-admin/contacts"))}>
          Mark unread
        </button>
        {confirm ? (
          <>
            <button
              type="button"
              className={`${button} bg-red-600 text-white hover:bg-red-700`}
              disabled={pending}
              onClick={() => run(() => deleteConversationAction(conversationKey, address), () => router.push("/portal-cfs-admin/contacts"))}
            >
              Delete conversation
            </button>
            <button type="button" className={plain} onClick={() => setConfirm(false)}>
              Keep it
            </button>
          </>
        ) : (
          <button type="button" className={`${button} border border-red-500/50 text-red-500 hover:bg-red-500/10`} onClick={() => setConfirm(true)}>
            Delete
          </button>
        )}
      </div>
      {confirm && <p className="text-xs text-muted-foreground">Their emails go to Trash in office@; their form messages are deleted.</p>}
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

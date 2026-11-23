"use client";

import { useId, useState, useSyncExternalStore, useTransition } from "react";
import { sendReplyAction } from "../actions";

const noSubscription = () => () => {};

const draftKey = (key: string) => `cfs-reply-draft:${key}`;

function readDraft(key: string): string {
  try {
    return localStorage.getItem(draftKey(key)) ?? "";
  } catch {
    // Storage blocked (private window): the draft simply is not kept.
    return "";
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value) localStorage.setItem(draftKey(key), value);
    else localStorage.removeItem(draftKey(key));
  } catch {
    // Storage blocked: typing still works, only the safety copy is lost.
  }
}

/** The answer box under a conversation. The text is kept in this browser until it is sent. */
export default function ReplyBox({ conversationKey, address, name, subject }: { conversationKey: string; address: string; name: string; subject: string }) {
  const id = useId();
  const saved = useSyncExternalStore(noSubscription, () => readDraft(conversationKey), () => "");
  // Until the first keystroke the box shows the draft kept from an earlier visit.
  const [typed, setText] = useState<string | null>(null);
  const text = typed ?? saved;
  const [status, setStatus] = useState<{ tone: "ok" | "error"; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    if (!text.trim() || pending) return;
    setStatus(null);
    startTransition(async () => {
      const result = await sendReplyAction(conversationKey, address, text);
      if (result.ok) {
        setText("");
        writeDraft(conversationKey, "");
        setStatus({ tone: "ok", message: `Sent to ${name === address ? address : `${name} <${address}>`}.` });
      } else {
        setStatus({ tone: "error", message: result.error });
      }
    });
  };

  return (
    <form
      className="rounded-xl border border-border bg-surface p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        Answer
      </label>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Goes from office@ to {address} as &ldquo;{subject}&rdquo;, with their last message quoted below.
      </p>
      <textarea
        id={id}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          writeDraft(conversationKey, e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            send();
          }
        }}
        rows={8}
        maxLength={20000}
        placeholder={`Hi ${name.split(/\s+/)[0] && name !== address ? name.split(/\s+/)[0] : "there"},`}
        className="mt-3 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground focus:border-accent focus:outline-none"
        aria-describedby={status ? `${id}-status` : undefined}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send"}
        </button>
        <span className="text-xs text-muted-foreground">Ctrl+Enter sends. The draft is kept here until you send it.</span>
      </div>
      <p id={`${id}-status`} role={status?.tone === "error" ? "alert" : "status"} className={`mt-3 text-sm font-semibold ${status?.tone === "error" ? "text-red-500" : "text-accent"}`}>
        {status?.message}
      </p>
    </form>
  );
}

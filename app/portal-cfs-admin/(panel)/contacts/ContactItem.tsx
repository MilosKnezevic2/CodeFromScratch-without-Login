"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { STATUS_LABEL, type InboxStatus } from "@/lib/contact-inbox";
import { changeMessageAction, markReadAction, type Change } from "./actions";

export type ContactItemData = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: InboxStatus;
  kind: "pitch" | "contact";
  when: string;
  age: string;
  repliedWhen: string | null;
  replyHref: string;
  userId: string | null;
};

const STATUS_STYLE: Record<InboxStatus, string> = {
  new: "bg-accent text-accent-foreground",
  read: "border border-border text-muted-foreground",
  replied: "bg-accent/10 text-accent",
  done: "border border-border text-muted-foreground",
};

const button =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const plain = `${button} border border-border text-foreground hover:border-accent/50`;

/** One message: a summary row that opens into the full text and what can be done with it. */
export default function ContactItem({ item }: { item: ContactItemData }) {
  // Opening a new message shows it as read at once; the server catches up in the background.
  const [opened, setOpened] = useState(false);
  const status: InboxStatus = item.status === "new" && opened ? "read" : item.status;
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = (change: Change) => startTransition(() => changeMessageAction(item.id, change));

  const onToggle = (open: boolean) => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    if (item.status === "new" && !opened) {
      setOpened(true);
      void markReadAction(item.id);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure origin or a denied permission): the address stays visible to copy by hand.
      setCopied(false);
    }
  };

  const unread = status === "new";
  const title = item.subject?.trim() || "(no subject)";

  return (
    <li>
      <details
        className={`group rounded-xl border bg-surface transition open:border-accent/40 ${unread ? "border-accent/40" : "border-border"}`}
        onToggle={(e) => onToggle(e.currentTarget.open)}
        aria-busy={pending}
      >
        <summary className="flex cursor-pointer list-none items-start gap-3 rounded-xl p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-accent" : "bg-transparent"}`} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={`truncate text-sm ${unread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>{item.name}</span>
              <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
              {item.kind === "pitch" && <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-foreground">Write for us</span>}
            </span>
            <span className={`mt-1 block truncate text-sm ${unread ? "text-foreground" : "text-muted"}`}>{title}</span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground group-open:hidden">{item.message}</span>
          </span>
          <span className="shrink-0 text-right text-xs text-muted-foreground">
            <span className="block font-medium">{item.age}</span>
            <span className="hidden sm:block">{item.when}</span>
          </span>
        </summary>

        <div className="border-t border-border px-4 pb-4 pt-3 sm:pl-[2.375rem]">
          <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">From</dt>
            <dd className="break-all text-foreground">
              {item.name} &lt;{item.email}&gt;
              {item.userId && (
                <>
                  {" · "}
                  <Link href={`/portal-cfs-admin/users/${item.userId}`} className="text-accent underline-offset-2 hover:underline">
                    reader account
                  </Link>
                </>
              )}
            </dd>
            <dt className="text-muted-foreground">Sent</dt>
            <dd className="text-foreground">
              {item.when} ({item.age})
            </dd>
            {item.repliedWhen && (
              <>
                <dt className="text-muted-foreground">Replied</dt>
                <dd className="text-foreground">{item.repliedWhen}</dd>
              </>
            )}
          </dl>

          <p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-foreground">{item.message}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <a href={item.replyHref} className={`${button} bg-accent text-accent-foreground hover:opacity-90`}>
              Reply by email
            </a>
            <button type="button" className={plain} onClick={copy}>
              {copied ? "Copied" : "Copy address"}
            </button>
            {status === "replied" ? (
              <button type="button" className={plain} disabled={pending} onClick={() => run("unreplied")}>
                Not replied yet
              </button>
            ) : (
              status !== "done" && (
                <button type="button" className={plain} disabled={pending} onClick={() => run("replied")}>
                  Mark as replied
                </button>
              )
            )}
            {status === "done" ? (
              <button type="button" className={plain} disabled={pending} onClick={() => run("unarchive")}>
                Back to inbox
              </button>
            ) : (
              <button type="button" className={plain} disabled={pending} onClick={() => run("archive")}>
                Done
              </button>
            )}
            {status === "read" && (
              <button
                type="button"
                className={plain}
                disabled={pending}
                onClick={() => {
                  setOpened(false);
                  run("unread");
                }}
              >
                Mark unread
              </button>
            )}
            {confirmDelete ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={`${button} bg-red-600 text-white hover:bg-red-700`}
                  disabled={pending}
                  onClick={() => run("delete")}
                >
                  Delete for good
                </button>
                <button type="button" className={plain} onClick={() => setConfirmDelete(false)}>
                  Keep it
                </button>
              </span>
            ) : (
              <button
                type="button"
                className={`${button} border border-red-500/50 text-red-500 hover:bg-red-500/10`}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Reply by email opens your mail program with the answer started. After sending, press Mark as replied.
          </p>
        </div>
      </details>
    </li>
  );
}

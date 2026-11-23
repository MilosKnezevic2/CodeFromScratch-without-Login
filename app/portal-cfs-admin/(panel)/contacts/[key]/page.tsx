import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATUS_LABEL, isConversationKey, replySubject, splitQuoted, type ThreadItem } from "@/lib/mailbox/conversations";
import { age, formatSize, formatWhen, mailtoReply } from "@/lib/mailbox/format";
import { bodyKey, openConversation } from "@/lib/mailbox/inbox";
import MailboxNotice from "../MailboxNotice";
import { STATUS_STYLE } from "../styles";
import ConversationActions from "./ConversationActions";
import MarkRead from "./MarkRead";
import ReplyBox from "./ReplyBox";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false, follow: false },
};

function Text({ text }: { text: string }) {
  const { body, quoted } = splitQuoted(text);
  return (
    <>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{body || "(no text)"}</p>
      {quoted && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">Show earlier text</summary>
          <p className="mt-2 whitespace-pre-wrap break-words border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">{quoted}</p>
        </details>
      )}
    </>
  );
}

export default async function ConversationPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isConversationKey(key)) notFound();
  const open = await openConversation(key).catch((error: unknown) => {
    console.error("contacts: could not open the conversation", error);
    return undefined;
  });
  if (open === undefined) return <p className="text-muted">The database did not answer. It may be waking up; reload in a minute.</p>;
  if (open === null) notFound();

  const { conversation: c, bodies, mailbox } = open;
  const now = new Date();
  const lastTheirs = [...c.items].reverse().find((i) => i.kind !== "out");
  const subject = replySubject(lastTheirs?.subject ?? "");

  const label = (item: ThreadItem) =>
    item.kind === "out" ? "Email" : item.kind === "form" ? (item.form.subject ?? "").startsWith("Write for us: ") ? "Write for us form" : "Contact form" : "Email";

  return (
    <div className="space-y-6">
      <Link href="/portal-cfs-admin/contacts" className="inline-flex min-h-10 items-center text-sm font-semibold text-muted transition hover:text-foreground">
        ← All contacts
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-foreground">{c.name}</h1>
          <p className="mt-1 break-all text-sm text-muted">{c.address}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
            {c.pitch && <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-foreground">Write for us</span>}
            <span>
              {c.items.length} {c.items.length === 1 ? "message" : "messages"} · last {age(c.lastDate, now)}
            </span>
          </p>
        </div>
        <ConversationActions conversationKey={c.key} address={c.address} done={c.status === "done"} />
      </div>

      <MailboxNotice state={mailbox} />
      {c.unread > 0 && <MarkRead conversationKey={c.key} address={c.address} />}

      <ol className="space-y-4" aria-label="Messages, oldest first">
        {c.items.map((item) => {
          const mine = item.kind === "out";
          const mailBody = item.kind === "form" ? null : bodies.get(bodyKey(item.mail));
          return (
            <li
              key={item.kind === "form" ? `form:${item.form.id}` : bodyKey(item.mail)}
              className={`rounded-xl border p-4 sm:p-5 ${mine ? "border-accent/30 bg-accent/5 sm:ml-10" : "border-border bg-surface sm:mr-10"}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-xs font-semibold text-foreground">
                  {mine ? "You" : c.name} <span className="font-normal text-muted-foreground">· {label(item)}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  <time dateTime={item.date.toISOString()}>{formatWhen(item.date)}</time> ({age(item.date, now)})
                </p>
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">{item.subject}</p>
              <div className="mt-3">
                {item.kind === "form" ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{item.form.message}</p>
                ) : mailBody ? (
                  <Text text={mailBody.text} />
                ) : (
                  <p className="text-sm text-muted">The text of this email could not be loaded.</p>
                )}
              </div>
              {mailBody && mailBody.attachments.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Attachments">
                  {mailBody.attachments.map((a, i) => (
                    <li key={i} className="rounded-lg border border-border px-2 py-1 text-xs text-muted">
                      📎 {a.filename} ({formatSize(a.size)})
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      {mailbox.connected ? (
        <ReplyBox conversationKey={c.key} address={c.address} name={c.name} subject={subject} />
      ) : (
        <a
          href={mailtoReply(c.address, subject)}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
        >
          Reply in your mail program
        </a>
      )}
    </div>
  );
}

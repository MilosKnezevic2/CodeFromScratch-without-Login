import type { Metadata } from "next";
import Link from "next/link";
import { STATUS_LABEL, type Conversation } from "@/lib/mailbox/conversations";
import { loadInbox } from "@/lib/mailbox/inbox";
import { age, formatWhen } from "@/lib/mailbox/format";
import { markAllReadAction } from "./actions";
import MailboxNotice from "./MailboxNotice";
import { STATUS_STYLE } from "./styles";

export const metadata: Metadata = {
  title: "Contacts",
  robots: { index: false, follow: false },
};

type View = "inbox" | "done";

function Row({ c, now }: { c: Conversation; now: Date }) {
  const unread = c.status === "new";
  const last = c.items[c.items.length - 1];
  const who = last.kind === "out" ? "You: " : "";
  return (
    <li>
      <Link
        href={`/portal-cfs-admin/contacts/${c.key}`}
        prefetch={false}
        className={`flex items-start gap-3 rounded-xl border bg-surface p-4 transition hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${unread ? "border-accent/40" : "border-border"}`}
      >
        <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-accent" : "bg-transparent"}`} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`truncate text-sm text-foreground ${unread ? "font-bold" : "font-semibold"}`}>{c.name}</span>
            <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[c.status]}`}>
              {STATUS_LABEL[c.status]}
              {c.unread > 1 ? ` · ${c.unread}` : ""}
            </span>
            {c.pitch && <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-foreground">Write for us</span>}
          </span>
          <span className={`mt-1 block truncate text-sm ${unread ? "text-foreground" : "text-muted"}`}>{c.lastSubject}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {who}
            {c.items.length} {c.items.length === 1 ? "message" : "messages"} · {c.address}
          </span>
        </span>
        <span className="shrink-0 text-right text-xs text-muted-foreground">
          <span className="block font-medium">{age(c.lastDate, now)}</span>
          <span className="hidden sm:block">{formatWhen(c.lastDate)}</span>
        </span>
      </Link>
    </li>
  );
}

export default async function AdminContactsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view: View = (await searchParams).view === "done" ? "done" : "inbox";
  const data = await loadInbox().catch((error: unknown) => {
    console.error("contacts: the database did not answer", error);
    return null;
  });
  if (!data) {
    return <p className="text-muted">The database did not answer. It may be waking up; reload in a minute.</p>;
  }

  const { conversations, mailbox } = data;
  const open = conversations.filter((c) => c.status !== "done");
  const done = conversations.filter((c) => c.status === "done");
  const shown = view === "done" ? done : open;
  const unread = open.filter((c) => c.status === "new").length;
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
        <p className="mt-1 text-sm text-muted">
          Every conversation with one person in one place: their messages from the site&rsquo;s forms, their emails to office@ and your answers.
        </p>
      </div>

      <MailboxNotice state={mailbox} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Contact folders" className="inline-flex rounded-xl border border-border bg-surface p-1">
          {(["inbox", "done"] as const).map((v) => (
            <Link
              key={v}
              href={v === "inbox" ? "/portal-cfs-admin/contacts" : "/portal-cfs-admin/contacts?view=done"}
              aria-current={view === v ? "page" : undefined}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-muted transition hover:text-foreground aria-[current=page]:bg-accent/15 aria-[current=page]:text-accent"
            >
              {v === "inbox" ? "Inbox" : "Done"}
              <span className="text-xs font-medium tabular-nums">{v === "inbox" ? open.length : done.length}</span>
            </Link>
          ))}
        </nav>
        {view === "inbox" && unread > 0 && (
          <form action={markAllReadAction}>
            <button type="submit" className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition hover:border-accent/50">
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-semibold text-foreground">{view === "inbox" ? "Nothing waiting." : "Nothing filed yet."}</p>
          <p className="mt-1 text-sm text-muted">
            {view === "inbox"
              ? "New messages from the forms and new emails to office@ appear here."
              : "Conversations you mark as Done move here. A new message from the person brings one back to the inbox."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((c) => (
            <Row key={c.key} c={c} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}

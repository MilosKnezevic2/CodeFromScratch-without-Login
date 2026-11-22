import type { Metadata } from "next";
import Link from "next/link";
import { age, formatWhen, inboxKind, inboxStatus, replyLink } from "@/lib/contact-inbox";
import { prisma } from "@/lib/prisma";
import { markAllReadAction } from "./actions";
import ContactItem, { type ContactItemData } from "./ContactItem";

export const metadata: Metadata = {
  title: "Contacts",
  robots: { index: false, follow: false },
};

type View = "inbox" | "done";

const VIEWS: { key: View; label: string }[] = [
  { key: "inbox", label: "Inbox" },
  { key: "done", label: "Done" },
];

const LIMIT = 200;

export default async function AdminContactsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view: View = (await searchParams).view === "done" ? "done" : "inbox";
  const archived = view === "done" ? { not: null } : null;

  const data = await Promise.all([
    prisma.contactSubmission.findMany({
      where: { archivedAt: archived },
      // The inbox shows what still needs an answer first; Done shows the latest filed first.
      orderBy: view === "done" ? { archivedAt: "desc" } : { createdAt: "desc" },
      take: LIMIT,
    }),
    prisma.contactSubmission.count({ where: { archivedAt: null } }),
    prisma.contactSubmission.count({ where: { archivedAt: null, read: false } }),
    prisma.contactSubmission.count({ where: { archivedAt: { not: null } } }),
  ]).catch((error: unknown) => {
    console.error("contacts: the database did not answer", error);
    return null;
  });

  if (!data) {
    return <p className="text-muted">The database did not answer. It may be waking up; reload in a minute.</p>;
  }
  const [messages, inboxCount, unreadCount, doneCount] = data;
  const counts: Record<View, number> = { inbox: inboxCount, done: doneCount };

  const now = new Date();
  const items: ContactItemData[] = messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    message: m.message,
    status: inboxStatus(m),
    kind: inboxKind(m.subject),
    when: formatWhen(m.createdAt),
    age: age(m.createdAt, now),
    repliedWhen: m.repliedAt ? formatWhen(m.repliedAt) : null,
    replyHref: replyLink(m),
    userId: m.userId,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
        <p className="mt-1 text-sm text-muted">
          Messages from the contact form and pitches from Write for us. Open a message to read it; answer it by email, then file it under Done.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Contact folders" className="inline-flex rounded-xl border border-border bg-surface p-1">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={v.key === "inbox" ? "/portal-cfs-admin/contacts" : "/portal-cfs-admin/contacts?view=done"}
              aria-current={view === v.key ? "page" : undefined}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-muted transition hover:text-foreground aria-[current=page]:bg-accent/15 aria-[current=page]:text-accent"
            >
              {v.label}
              <span className="text-xs font-medium tabular-nums">{counts[v.key]}</span>
            </Link>
          ))}
        </nav>
        {view === "inbox" && unreadCount > 0 && (
          <form action={markAllReadAction}>
            <button type="submit" className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition hover:border-accent/50">
              Mark all {unreadCount} as read
            </button>
          </form>
        )}
      </div>

      {view === "inbox" && <p className="text-sm text-muted">{unreadCount === 0 ? "No new messages." : `${unreadCount} new ${unreadCount === 1 ? "message" : "messages"}.`}</p>}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-semibold text-foreground">{view === "inbox" ? "The inbox is empty." : "Nothing filed yet."}</p>
          <p className="mt-1 text-sm text-muted">
            {view === "inbox" ? "New messages from the contact form and Write for us appear here." : "Messages you mark as Done move here, and can go back to the inbox."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <ContactItem key={item.id} item={item} />
          ))}
        </ul>
      )}
      {messages.length === LIMIT && <p className="text-xs text-muted-foreground">Showing the latest {LIMIT}.</p>}
    </div>
  );
}

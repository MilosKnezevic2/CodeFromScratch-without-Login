import { createHash } from "node:crypto";

/**
 * The contacts inbox groups everything exchanged with one person into one
 * conversation: their form messages (from the database), the mail they sent
 * to the office mailbox and the replies sent to them from it. Pure: the IMAP
 * and database reads happen in lib/mailbox/imap.ts and the admin pages.
 */

export type Address = { name: string; address: string };

/** One mail as the list needs it: headers only, no body. */
export type MailHeader = {
  folder: "inbox" | "sent";
  uid: number;
  messageId: string | null;
  references: string[];
  from: Address | null;
  to: Address[];
  replyTo: Address[];
  subject: string;
  date: Date;
  seen: boolean;
};

/** A message from the contact or Write for us form, stored in the database. */
export type FormMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: Date;
};

export type ThreadItem =
  | { kind: "form"; date: Date; subject: string; unread: boolean; form: FormMessage }
  | { kind: "in" | "out"; date: Date; subject: string; unread: boolean; mail: MailHeader };

export type ConversationStatus = "new" | "waiting" | "replied" | "done";

export type Conversation = {
  key: string;
  address: string;
  name: string;
  items: ThreadItem[];
  lastDate: Date;
  lastSubject: string;
  unread: number;
  status: ConversationStatus;
  pitch: boolean;
};

export const STATUS_LABEL: Record<ConversationStatus, string> = {
  new: "New",
  waiting: "Needs reply",
  replied: "Replied",
  done: "Done",
};

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/** A stable, opaque id for a person's conversation, so no email address appears in admin URLs. */
export function conversationKey(address: string): string {
  return createHash("sha256").update(`cfs-contact:${normalizeAddress(address)}`).digest("hex").slice(0, 24);
}

export function isConversationKey(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/.test(value);
}

/** "Re: Re: Fwd: Hello" and "Hello" belong to the same subject line. */
export function baseSubject(subject: string): string {
  return subject.replace(/^(\s*(re|fwd?|aw|wg|sv|antw)\s*(\[\d+\])?\s*:\s*)+/i, "").trim();
}

export function replySubject(subject: string): string {
  const base = baseSubject(subject);
  return `Re: ${base || "Your message to CodeFromScratch"}`;
}

/**
 * Who a mail was exchanged with. Mail from the site itself (form
 * notifications, newsletter test copies) is left out: the form message is
 * already in the database, and the copies are not conversations.
 */
export function counterpart(mail: MailHeader, self: Set<string>): Address | null {
  if (mail.folder === "inbox") {
    const from = mail.from && normalizeAddress(mail.from.address);
    if (!from || self.has(from)) return null;
    return { name: mail.from?.name ?? "", address: from };
  }
  const to = mail.to.find((a) => !self.has(normalizeAddress(a.address)));
  return to ? { name: to.name, address: normalizeAddress(to.address) } : null;
}

const PITCH_PREFIX = "Write for us: ";

export function buildConversations(input: {
  mails: MailHeader[];
  forms: FormMessage[];
  self: Set<string>;
  archived: Map<string, Date>;
}): Conversation[] {
  const byKey = new Map<string, { address: string; names: string[]; items: ThreadItem[] }>();
  const add = (address: string, name: string, item: ThreadItem) => {
    const key = conversationKey(address);
    const entry = byKey.get(key) ?? { address: normalizeAddress(address), names: [], items: [] };
    if (name.trim()) entry.names.push(name.trim());
    entry.items.push(item);
    byKey.set(key, entry);
  };

  for (const form of input.forms) {
    add(form.email, form.name, { kind: "form", date: form.createdAt, subject: form.subject?.trim() || "(no subject)", unread: !form.read, form });
  }
  for (const mail of input.mails) {
    const who = counterpart(mail, input.self);
    if (!who) continue;
    const kind = mail.folder === "inbox" ? "in" : "out";
    // Only the person's own name counts; a name on our reply is how we addressed them.
    add(who.address, kind === "in" ? who.name : "", { kind, date: mail.date, subject: mail.subject.trim() || "(no subject)", unread: kind === "in" && !mail.seen, mail });
  }

  const conversations: Conversation[] = [];
  for (const [key, entry] of byKey) {
    const items = entry.items.sort((a, b) => a.date.getTime() - b.date.getTime());
    const last = items[items.length - 1];
    const unread = items.filter((i) => i.unread).length;
    const archivedAt = input.archived.get(key);
    const lastFromThem = last.kind !== "out";
    const status: ConversationStatus =
      archivedAt && archivedAt >= last.date ? "done" : unread > 0 ? "new" : lastFromThem ? "waiting" : "replied";
    conversations.push({
      key,
      address: entry.address,
      // The latest name they used wins; the address stands in when they gave none.
      name: entry.names[entry.names.length - 1] ?? entry.address,
      items,
      lastDate: last.date,
      lastSubject: [...items].reverse().find((i) => i.kind !== "out")?.subject ?? last.subject,
      unread,
      status,
      pitch: items.some((i) => i.kind === "form" && (i.form.subject ?? "").startsWith(PITCH_PREFIX)),
    });
  }
  return conversations.sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());
}

/**
 * Splits a mail body into what the person wrote and the quoted history
 * below it ("On ... wrote:" followed by "> " lines), so a conversation does
 * not repeat every earlier message inside each reply.
 */
export function splitQuoted(text: string): { body: string; quoted: string } {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let cut = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const header = /^(on\s.+wrote:|am\s.+schrieb.*:|-{2,}\s*original message\s*-{2,}|_{5,}|from:\s.+)$/i.test(line);
    const quoteRun = line.startsWith(">") && lines.slice(i).every((l) => l.trim() === "" || l.trim().startsWith(">"));
    if (header || quoteRun) {
      cut = i;
      break;
    }
  }
  if (cut <= 0) return { body: text.trim(), quoted: "" };
  return { body: lines.slice(0, cut).join("\n").trim(), quoted: lines.slice(cut).join("\n").trim() };
}

/** The quote placed under a reply, the way mail programs do it. */
export function quoteFor(text: string, name: string, date: Date, limit = 2000): string {
  const body = text.length > limit ? `${text.slice(0, limit).trimEnd()} […]` : text;
  const when = date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });
  return `On ${when}, ${name} wrote:\n${body
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n")}`;
}

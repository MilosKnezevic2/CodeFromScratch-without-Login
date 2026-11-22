import { SUBJECT_PREFIX } from "@/lib/write-for-us";

/** What the admin inbox needs to know about one message. */
export type InboxMessage = {
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  repliedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
};

export type InboxStatus = "new" | "read" | "replied" | "done";

export const STATUS_LABEL: Record<InboxStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  done: "Done",
};

/** Filed beats answered beats opened: the label says where the message stands now. */
export function inboxStatus(m: Pick<InboxMessage, "read" | "repliedAt" | "archivedAt">): InboxStatus {
  if (m.archivedAt) return "done";
  if (m.repliedAt) return "replied";
  return m.read ? "read" : "new";
}

/** Pitches from the "Write for us" form share the inbox with the contact form. */
export function inboxKind(subject: string | null): "pitch" | "contact" {
  return subject?.startsWith(SUBJECT_PREFIX) ? "pitch" : "contact";
}

/** Mail clients refuse very long mailto links; the quote is cut well before that. */
const QUOTE_LIMIT = 1200;

const TZ = "Europe/Vienna";

export function formatWhen(date: Date): string {
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

/**
 * A mailto: link that opens the operator's own mail program with the answer
 * started: the sender as recipient, "Re:" subject, and the message quoted
 * below. The reply goes from their mailbox, so it lands in their Sent folder
 * and the conversation continues there.
 */
export function replyLink(m: Pick<InboxMessage, "name" | "email" | "subject" | "message" | "createdAt">): string {
  const subject = `Re: ${m.subject?.trim() || "Your message to CodeFromScratch"}`;
  const text = m.message.length > QUOTE_LIMIT ? `${m.message.slice(0, QUOTE_LIMIT).trimEnd()} […]` : m.message;
  const quoted = text
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\r\n");
  const firstName = m.name.trim().split(/\s+/)[0] ?? "";
  const body = `Hi ${firstName},\r\n\r\n\r\n\r\nOn ${formatWhen(m.createdAt)}, ${m.name} wrote:\r\n${quoted}`;
  // "@" stays literal: some mail programs do not decode %40 in the address.
  return `mailto:${encodeURIComponent(m.email).replace(/%40/g, "@")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** "3 days ago", "8 months ago": how long a message has waited, next to its exact date. */
export function age(date: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  const units: [number, string][] = [
    [365 * 86400, "year"],
    [30 * 86400, "month"],
    [7 * 86400, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [size, unit] of units) {
    if (seconds < size) continue;
    const n = Math.round(seconds / size);
    return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

/** The ids the inbox actions accept: Prisma cuids. Anything else is refused before the database. */
export function isMessageId(value: unknown): value is string {
  return typeof value === "string" && /^c[a-z0-9]{20,30}$/.test(value);
}

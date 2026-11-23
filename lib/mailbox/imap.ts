import { ImapFlow, type FetchMessageObject, type MessageAddressObject } from "imapflow";
import { simpleParser } from "mailparser";
import type { MailboxConfig } from "./config";
import type { Address, MailHeader } from "./conversations";

/**
 * Reading the office mailbox over IMAP. Server code only. Every call opens
 * one connection and closes it again: the admin pages are rare and short, so
 * a pooled connection would only sit idle on a serverless function.
 */

export type Folders = { inbox: string; sent: string | null; trash: string | null };

/** One mail with its text, for the conversation view. HTML is never rendered: only its text. */
export type MailBody = {
  folder: "inbox" | "sent";
  uid: number;
  text: string;
  attachments: { filename: string; size: number }[];
};

const LIST_LIMIT = 300;
const LIST_DAYS = 365;

export async function withMailbox<T>(config: MailboxConfig, run: (client: ImapFlow, folders: Folders) => Promise<T>): Promise<T> {
  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: { user: config.user, pass: config.password },
    logger: false,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });
  await client.connect();
  try {
    return await run(client, await findFolders(client));
  } finally {
    await client.logout().catch(() => client.close());
  }
}

/** Sent and Trash have different names per provider; the server marks them (RFC 6154), names are the fallback. */
async function findFolders(client: ImapFlow): Promise<Folders> {
  const list = await client.list();
  const byUse = (use: string, names: string[]) =>
    list.find((f) => f.specialUse === use)?.path ?? list.find((f) => names.includes(f.path.toLowerCase()))?.path ?? null;
  return {
    inbox: "INBOX",
    sent: byUse("\\Sent", ["sent", "sent items", "sent messages", "inbox.sent"]),
    trash: byUse("\\Trash", ["trash", "deleted items", "deleted messages", "inbox.trash"]),
  };
}

const toAddress = (a: MessageAddressObject | undefined): Address | null =>
  a?.address ? { name: a.name ?? "", address: a.address.toLowerCase() } : null;
const toAddresses = (list: MessageAddressObject[] | undefined): Address[] => (list ?? []).map(toAddress).filter((a): a is Address => a !== null);

function referencesOf(headers: Buffer | undefined): string[] {
  const raw = headers?.toString("utf8").replace(/\r?\n\s+/g, " ") ?? "";
  const line = /^references:\s*(.*)$/im.exec(raw)?.[1] ?? "";
  return line.match(/<[^>]+>/g) ?? [];
}

function toHeader(folder: MailHeader["folder"], msg: FetchMessageObject): MailHeader {
  const env = msg.envelope;
  return {
    folder,
    uid: msg.uid,
    messageId: env?.messageId ?? null,
    references: [...new Set([...referencesOf(msg.headers), ...(env?.inReplyTo ? [env.inReplyTo] : [])])],
    from: toAddress(env?.from?.[0]),
    to: [...toAddresses(env?.to), ...toAddresses(env?.cc)],
    replyTo: toAddresses(env?.replyTo),
    subject: env?.subject ?? "",
    date: new Date(env?.date ?? msg.internalDate ?? 0),
    seen: msg.flags?.has("\\Seen") ?? false,
  };
}

async function headersIn(client: ImapFlow, path: string, folder: MailHeader["folder"], criteria: object): Promise<MailHeader[]> {
  const lock = await client.getMailboxLock(path, { readOnly: true });
  try {
    const found = await client.search(criteria, { uid: true });
    if (!found || found.length === 0) return [];
    const uids = found.slice(-LIST_LIMIT);
    const out: MailHeader[] = [];
    for await (const msg of client.fetch(uids, { uid: true, envelope: true, flags: true, internalDate: true, headers: ["references"] }, { uid: true })) {
      out.push(toHeader(folder, msg));
    }
    return out;
  } finally {
    lock.release();
  }
}

/** Headers of the last year of mail in the inbox and in Sent, newest 300 of each. */
export async function listHeaders(client: ImapFlow, folders: Folders): Promise<MailHeader[]> {
  const since = new Date(Date.now() - LIST_DAYS * 86_400_000);
  const inbox = await headersIn(client, folders.inbox, "inbox", { since });
  const sent = folders.sent ? await headersIn(client, folders.sent, "sent", { since }) : [];
  return [...inbox, ...sent];
}

/** Everything exchanged with one address, without a time limit. */
export async function conversationHeaders(client: ImapFlow, folders: Folders, address: string): Promise<MailHeader[]> {
  const inbox = await headersIn(client, folders.inbox, "inbox", { from: address });
  const sent = folders.sent ? await headersIn(client, folders.sent, "sent", { or: [{ to: address }, { cc: address }] }) : [];
  // IMAP SEARCH matches parts of addresses ("ana@x.com" also finds "joana@x.com"); keep exact matches only.
  return [...inbox.filter((m) => m.from?.address === address), ...sent.filter((m) => m.to.some((a) => a.address === address))];
}

/** Downloads and parses the given mails. Bodies are capped so one huge mail cannot stall the page. */
export async function readBodies(client: ImapFlow, folders: Folders, mails: Pick<MailHeader, "folder" | "uid">[]): Promise<MailBody[]> {
  const out: MailBody[] = [];
  for (const folder of ["inbox", "sent"] as const) {
    const path = folder === "inbox" ? folders.inbox : folders.sent;
    const uids = mails.filter((m) => m.folder === folder).map((m) => m.uid);
    if (!path || uids.length === 0) continue;
    const lock = await client.getMailboxLock(path, { readOnly: true });
    try {
      for await (const msg of client.fetch(uids, { uid: true, source: { maxLength: 2_000_000 } }, { uid: true })) {
        if (!msg.source) continue;
        const parsed = await simpleParser(msg.source, { skipImageLinks: true, skipTextLinks: true });
        out.push({
          folder,
          uid: msg.uid,
          text: (parsed.text ?? "").trim(),
          attachments: parsed.attachments.filter((a) => a.contentDisposition !== "inline").map((a) => ({ filename: a.filename ?? "attachment", size: a.size })),
        });
      }
    } finally {
      lock.release();
    }
  }
  return out;
}

export async function setSeen(client: ImapFlow, folders: Folders, uids: number[], seen: boolean): Promise<void> {
  if (uids.length === 0) return;
  const lock = await client.getMailboxLock(folders.inbox);
  try {
    if (seen) await client.messageFlagsAdd(uids, ["\\Seen"], { uid: true });
    else await client.messageFlagsRemove(uids, ["\\Seen"], { uid: true });
  } finally {
    lock.release();
  }
}

/** Marks everything in the inbox read, as "Mark all as read" in a mail program does. */
export async function markInboxRead(client: ImapFlow, folders: Folders): Promise<number> {
  const lock = await client.getMailboxLock(folders.inbox);
  try {
    const unseen = await client.search({ seen: false }, { uid: true });
    if (!unseen || unseen.length === 0) return 0;
    await client.messageFlagsAdd(unseen, ["\\Seen"], { uid: true });
    return unseen.length;
  } finally {
    lock.release();
  }
}

/** Moves inbox mails to Trash, where they can still be restored from any mail program. */
export async function trashInbox(client: ImapFlow, folders: Folders, uids: number[]): Promise<void> {
  if (uids.length === 0) return;
  if (!folders.trash) throw new Error("The mailbox has no Trash folder; nothing was deleted.");
  const lock = await client.getMailboxLock(folders.inbox);
  try {
    await client.messageMove(uids, folders.trash, { uid: true });
  } finally {
    lock.release();
  }
}

export async function saveToSent(client: ImapFlow, folders: Folders, raw: Buffer): Promise<void> {
  if (!folders.sent) return;
  await client.append(folders.sent, raw, ["\\Seen"], new Date());
}

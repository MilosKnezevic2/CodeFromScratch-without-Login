import { prisma } from "@/lib/prisma";
import { mailboxConfig, selfAddresses, type MailboxConfig } from "./config";
import { buildConversations, conversationKey, type Conversation, type FormMessage, type MailHeader } from "./conversations";
import { conversationHeaders, listHeaders, readBodies, withMailbox, type MailBody } from "./imap";

/**
 * What the admin contacts pages read: the form messages from the database,
 * the office mailbox over IMAP, and the Done marks. The mailbox failing (or
 * not being set up) never hides the form messages: the page says so instead.
 */

export type MailboxState = { connected: true } | { connected: false; reason: "not-configured" | "error"; detail?: string };

const FORM_LIMIT = 500;

async function formMessages(where: object = {}): Promise<FormMessage[]> {
  return prisma.contactSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: FORM_LIMIT,
    select: { id: true, name: true, email: true, subject: true, message: true, read: true, createdAt: true },
  });
}

async function archivedMap(keys?: string[]): Promise<Map<string, Date>> {
  const rows = await prisma.mailConversation.findMany({
    where: { archivedAt: { not: null }, ...(keys ? { key: { in: keys } } : {}) },
    select: { key: true, archivedAt: true },
  });
  return new Map(rows.map((r) => [r.key, r.archivedAt as Date]));
}

function describe(error: unknown): string {
  const e = error as { authenticationFailed?: boolean; code?: string; message?: string };
  if (e?.authenticationFailed) return "The mailbox refused the login. Check MAILBOX_USER and the app password in Vercel.";
  if (e?.code === "ETIMEDOUT" || e?.code === "ECONNREFUSED" || e?.code === "ENOTFOUND") return "The mail server did not answer. Try again in a minute.";
  return "The mailbox could not be read. Try again in a minute.";
}

async function readMailbox<T>(config: MailboxConfig | null, read: (config: MailboxConfig) => Promise<T>, empty: T): Promise<{ value: T; state: MailboxState }> {
  if (!config) return { value: empty, state: { connected: false, reason: "not-configured" } };
  try {
    return { value: await read(config), state: { connected: true } };
  } catch (error) {
    console.error("mailbox: read failed", error);
    return { value: empty, state: { connected: false, reason: "error", detail: describe(error) } };
  }
}

export async function loadInbox(): Promise<{ conversations: Conversation[]; mailbox: MailboxState }> {
  const config = mailboxConfig();
  const [forms, archived, mail] = await Promise.all([
    formMessages(),
    archivedMap(),
    readMailbox(config, (c) => withMailbox(c, listHeaders), [] as MailHeader[]),
  ]);
  return { conversations: buildConversations({ mails: mail.value, forms, self: selfAddresses(config), archived }), mailbox: mail.state };
}

export type OpenConversation = {
  conversation: Conversation;
  bodies: Map<string, MailBody>;
  mailbox: MailboxState;
};

export const bodyKey = (m: Pick<MailHeader, "folder" | "uid">) => `${m.folder}:${m.uid}`;

/**
 * One person's whole conversation, with the text of every mail. Reading has
 * no side effects: the page marks it read once it is on screen
 * (markConversationReadAction), so a re-render after "Mark unread" does not
 * undo it.
 */
export async function openConversation(key: string): Promise<OpenConversation | null> {
  const config = mailboxConfig();
  const self = selfAddresses(config);
  const allForms = await formMessages();
  let address = allForms.find((f) => conversationKey(f.email) === key)?.email.toLowerCase() ?? null;

  const mail = await readMailbox(
    config,
    (c) =>
      withMailbox(c, async (client, folders) => {
        if (!address) {
          // A conversation that started by email: find whose it is among the recent mail.
          const recent = await listHeaders(client, folders);
          const hit = buildConversations({ mails: recent, forms: [], self, archived: new Map() }).find((x) => x.key === key);
          address = hit?.address ?? null;
        }
        if (!address) return { headers: [] as MailHeader[], bodies: [] as MailBody[] };
        const headers = await conversationHeaders(client, folders, address);
        return { headers, bodies: await readBodies(client, folders, headers) };
      }),
    { headers: [] as MailHeader[], bodies: [] as MailBody[] },
  );
  if (!address) return null;

  const forms = allForms.filter((f) => f.email.toLowerCase() === address);
  const [conversation] = buildConversations({
    mails: mail.value.headers,
    forms,
    self,
    archived: await archivedMap([key]),
  });
  if (!conversation) return null;
  return {
    conversation,
    bodies: new Map(mail.value.bodies.map((b) => [bodyKey(b), b])),
    mailbox: mail.state,
  };
}

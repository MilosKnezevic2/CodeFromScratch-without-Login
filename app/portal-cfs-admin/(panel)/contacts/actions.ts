"use server";

import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { mailboxConfig, selfAddresses } from "@/lib/mailbox/config";
import { buildConversations, conversationKey, isConversationKey, quoteFor, replySubject, type ThreadItem } from "@/lib/mailbox/conversations";
import { conversationHeaders, markInboxRead, readBodies, saveToSent, setSeen, trashInbox, withMailbox } from "@/lib/mailbox/imap";
import { sendReply } from "@/lib/mailbox/send";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const LIST = "/portal-cfs-admin/contacts";
const REPLY_MAX = 20_000;

export type ActionResult = { ok: true } | { ok: false; error: string };

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

/**
 * Every action names the conversation by its key and the address it belongs
 * to; the two must match, so a request cannot point a reply at an address
 * that is not the conversation's.
 */
function checkTarget(key: unknown, address: unknown): string | null {
  if (!isConversationKey(key) || typeof address !== "string") return null;
  const normalized = address.trim().toLowerCase();
  if (!EMAIL.test(normalized) || normalized.length > 254 || conversationKey(normalized) !== key) return null;
  return normalized;
}

function refresh(key: string) {
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${key}`);
  revalidatePath("/portal-cfs-admin");
}

/** Sends the operator's answer from the office mailbox, as a reply to the latest message in the conversation. */
export async function sendReplyAction(key: string, address: string, text: string): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { ok: false, error: "Sign in to the admin again." };
  const to = checkTarget(key, address);
  if (!to) return { ok: false, error: "This conversation could not be found. Reload the page." };
  const body = typeof text === "string" ? text.replace(/\r\n?/g, "\n").trim() : "";
  if (!body) return { ok: false, error: "Write the answer first." };
  if (body.length > REPLY_MAX) return { ok: false, error: `The answer is too long (at most ${REPLY_MAX.toLocaleString("en")} characters).` };
  if (!rateLimit("contacts:reply", 30, 60 * 60 * 1000).success) return { ok: false, error: "Too many emails in the last hour. Wait a little." };
  const config = mailboxConfig();
  if (!config) return { ok: false, error: "The mailbox is not connected yet, so the answer cannot be sent from here. Use Reply in your mail program." };

  const forms = await prisma.contactSubmission.findMany({
    where: { email: { equals: to, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, name: true, email: true, subject: true, message: true, read: true, createdAt: true },
  });

  try {
    await withMailbox(config, async (client, folders) => {
      const headers = await conversationHeaders(client, folders, to);
      const [conversation] = buildConversations({ mails: headers, forms, self: selfAddresses(config), archived: new Map() });
      // The answer quotes and threads onto the latest thing they sent: a mail, or else their form message.
      const theirs = [...(conversation?.items ?? [])].reverse().find((i): i is Exclude<ThreadItem, { kind: "out" }> => i.kind !== "out");
      let quoted = "";
      let inReplyTo: string | null = null;
      let references: string[] = [];
      if (theirs?.kind === "in") {
        const [mailBody] = await readBodies(client, folders, [theirs.mail]);
        quoted = quoteFor(mailBody?.text ?? "", theirs.mail.from?.name || to, theirs.date);
        inReplyTo = theirs.mail.messageId;
        references = [...theirs.mail.references, ...(theirs.mail.messageId ? [theirs.mail.messageId] : [])];
      } else if (theirs?.kind === "form") {
        quoted = quoteFor(theirs.form.message, theirs.form.name, theirs.date);
      }
      const sent = await sendReply(config, {
        to: { name: conversation?.name && conversation.name !== to ? conversation.name : "", address: to },
        subject: replySubject(theirs?.subject ?? ""),
        text: quoted ? `${body}\n\n${quoted}` : body,
        inReplyTo,
        references: [...new Set(references)].slice(-20),
      });
      if (config.saveSent) {
        // The mail is already on its way; a failed copy to Sent must not report the send as failed.
        await saveToSent(client, folders, sent.raw).catch((error: unknown) => console.error("mailbox: could not file the reply in Sent", error));
      }
    });
  } catch (error) {
    console.error("mailbox: reply failed", error);
    return { ok: false, error: "The email could not be sent. Nothing went out; try again in a minute." };
  }
  // Answering a conversation brings it back from Done.
  await prisma.mailConversation.deleteMany({ where: { key } });
  await recordAudit("contact.reply", { ref: key });
  refresh(key);
  return { ok: true };
}

/**
 * Marks everything from them read: their mail in the mailbox (so the phone
 * shows it read too) and their form messages. The conversation page calls
 * it once it is on screen.
 */
export async function markConversationReadAction(key: string, address: string): Promise<void> {
  if (!(await isAdminRequest())) return;
  const to = checkTarget(key, address);
  if (!to) return;
  await prisma.contactSubmission.updateMany({ where: { email: { equals: to, mode: "insensitive" }, read: false }, data: { read: true } });
  const config = mailboxConfig();
  if (config) {
    try {
      await withMailbox(config, async (client, folders) => {
        const unseen = (await conversationHeaders(client, folders, to)).filter((h) => h.folder === "inbox" && !h.seen);
        await setSeen(client, folders, unseen.map((h) => h.uid), true);
      });
    } catch (error) {
      // The conversation stays marked New in the mailbox; the next visit tries again.
      console.error("mailbox: mark read failed", error);
    }
  }
  refresh(key);
}

export async function setDoneAction(key: string, done: boolean): Promise<void> {
  if (!isConversationKey(key) || !(await isAdminRequest())) return;
  const archivedAt = done ? new Date() : null;
  await prisma.mailConversation.upsert({ where: { key }, create: { key, archivedAt }, update: { archivedAt } });
  await recordAudit(done ? "contact.archive" : "contact.unarchive", { ref: key });
  refresh(key);
}

/** Marks the latest message from them unread again, in the mailbox or in the database. */
export async function markUnreadAction(key: string, address: string): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { ok: false, error: "Sign in to the admin again." };
  const to = checkTarget(key, address);
  if (!to) return { ok: false, error: "This conversation could not be found. Reload the page." };
  const config = mailboxConfig();
  const latestForm = await prisma.contactSubmission.findFirst({
    where: { email: { equals: to, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  let latestMail: { uid: number; date: Date } | null = null;
  if (config) {
    try {
      await withMailbox(config, async (client, folders) => {
        const inbound = (await conversationHeaders(client, folders, to)).filter((h) => h.folder === "inbox").sort((a, b) => b.date.getTime() - a.date.getTime());
        if (inbound[0] && (!latestForm || inbound[0].date > latestForm.createdAt)) {
          latestMail = { uid: inbound[0].uid, date: inbound[0].date };
          await setSeen(client, folders, [inbound[0].uid], false);
        }
      });
    } catch (error) {
      console.error("mailbox: mark unread failed", error);
      return { ok: false, error: "The mailbox could not be reached. Try again in a minute." };
    }
  }
  if (!latestMail && latestForm) await prisma.contactSubmission.update({ where: { id: latestForm.id }, data: { read: false } });
  // Only the list: re-rendering the open conversation here would mark it read again.
  revalidatePath(LIST);
  revalidatePath("/portal-cfs-admin");
  return { ok: true };
}

/**
 * Deletes a conversation: their mails go to Trash in the mailbox (still
 * restorable from any mail program) and their form messages are deleted.
 * Our own sent replies stay in Sent.
 */
export async function deleteConversationAction(key: string, address: string): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { ok: false, error: "Sign in to the admin again." };
  const to = checkTarget(key, address);
  if (!to) return { ok: false, error: "This conversation could not be found. Reload the page." };
  const config = mailboxConfig();
  if (config) {
    try {
      await withMailbox(config, async (client, folders) => {
        const inbound = (await conversationHeaders(client, folders, to)).filter((h) => h.folder === "inbox");
        await trashInbox(client, folders, inbound.map((h) => h.uid));
      });
    } catch (error) {
      console.error("mailbox: delete failed", error);
      return { ok: false, error: "The mails could not be moved to Trash, so nothing was deleted. Try again in a minute." };
    }
  }
  const { count } = await prisma.contactSubmission.deleteMany({ where: { email: { equals: to, mode: "insensitive" } } });
  await prisma.mailConversation.deleteMany({ where: { key } });
  await recordAudit("contact.delete", { ref: key, count });
  revalidatePath(LIST);
  revalidatePath("/portal-cfs-admin");
  return { ok: true };
}

/** Clears every "New" mark: the form messages and, when connected, the whole mailbox inbox. */
export async function markAllReadAction(): Promise<void> {
  if (!(await isAdminRequest())) return;
  const { count } = await prisma.contactSubmission.updateMany({ where: { read: false }, data: { read: true } });
  let mails = 0;
  const config = mailboxConfig();
  if (config) {
    try {
      mails = await withMailbox(config, markInboxRead);
    } catch (error) {
      console.error("mailbox: mark all read failed", error);
    }
  }
  await recordAudit("contact.read-all", { count, mails });
  revalidatePath(LIST);
  revalidatePath("/portal-cfs-admin");
}

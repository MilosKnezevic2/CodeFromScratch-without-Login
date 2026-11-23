import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  contactSubmission: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  mailConversation: { upsert: vi.fn(), deleteMany: vi.fn() },
}));
const admin = vi.hoisted(() => vi.fn());
const audit = vi.hoisted(() => vi.fn());
const imap = vi.hoisted(() => ({
  withMailbox: vi.fn(),
  conversationHeaders: vi.fn(),
  readBodies: vi.fn(),
  saveToSent: vi.fn(),
  setSeen: vi.fn(),
  trashInbox: vi.fn(),
  markInboxRead: vi.fn(),
}));
const send = vi.hoisted(() => vi.fn());
const config = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/admin-guard", () => ({ isAdminRequest: admin }));
vi.mock("@/lib/audit", () => ({ recordAudit: audit }));
vi.mock("@/lib/mailbox/imap", () => imap);
vi.mock("@/lib/mailbox/send", () => ({ sendReply: send }));
vi.mock("@/lib/mailbox/config", async (original) => ({ ...(await original<object>()), mailboxConfig: config }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { conversationKey } from "@/lib/mailbox/conversations";
import { deleteConversationAction, markConversationReadAction, markUnreadAction, sendReplyAction, setDoneAction } from "./actions";

const ADDRESS = "olivia@example.com";
const KEY = conversationKey(ADDRESS);
const CONFIG = { user: "office@codefromscratch.org", password: "x", imap: {}, smtp: {}, fromName: "CodeFromScratch", saveSent: true };
const theirMail = {
  folder: "inbox",
  uid: 7,
  messageId: "<their@example.com>",
  references: ["<first@cfs>"],
  from: { name: "Olivia Bennett", address: ADDRESS },
  to: [{ name: "", address: "office@codefromscratch.org" }],
  replyTo: [],
  subject: "Re: Typo",
  date: new Date("2026-11-20T10:00:00Z"),
  seen: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  admin.mockResolvedValue(true);
  config.mockReturnValue(CONFIG);
  db.contactSubmission.findMany.mockResolvedValue([]);
  db.contactSubmission.deleteMany.mockResolvedValue({ count: 1 });
  imap.withMailbox.mockImplementation(async (_c: unknown, run: (client: object, folders: object) => unknown) => run({}, { inbox: "INBOX", sent: "Sent", trash: "Trash" }));
  imap.conversationHeaders.mockResolvedValue([theirMail]);
  imap.readBodies.mockResolvedValue([{ folder: "inbox", uid: 7, text: "Thanks!", attachments: [] }]);
  send.mockResolvedValue({ messageId: "<new@cfs>", raw: Buffer.from("raw") });
  imap.saveToSent.mockResolvedValue(undefined);
});

describe("sendReplyAction", () => {
  it("does nothing without an admin session", async () => {
    admin.mockResolvedValue(false);
    expect(await sendReplyAction(KEY, ADDRESS, "Hi")).toMatchObject({ ok: false });
    expect(send).not.toHaveBeenCalled();
  });

  it("refuses an address that is not the conversation's, so a reply cannot be pointed elsewhere", async () => {
    expect(await sendReplyAction(KEY, "someone@else.example", "Hi")).toMatchObject({ ok: false });
    expect(await sendReplyAction(KEY, `${ADDRESS}\r\nBcc: x@evil.example`, "Hi")).toMatchObject({ ok: false });
    expect(send).not.toHaveBeenCalled();
  });

  it("answers the latest mail: threaded onto it, quoted under the text, filed in Sent", async () => {
    expect(await sendReplyAction(KEY, "Olivia@Example.com", "  Glad it works.  ")).toEqual({ ok: true });
    const reply = send.mock.calls[0][1];
    expect(reply).toMatchObject({
      to: { name: "Olivia Bennett", address: ADDRESS },
      subject: "Re: Typo",
      inReplyTo: "<their@example.com>",
      references: ["<first@cfs>", "<their@example.com>"],
    });
    expect(reply.text).toMatch(/^Glad it works\.\n\nOn .+, Olivia Bennett wrote:\n> Thanks!$/);
    expect(imap.saveToSent).toHaveBeenCalled();
    expect(db.mailConversation.deleteMany).toHaveBeenCalledWith({ where: { key: KEY } });
    expect(audit).toHaveBeenCalledWith("contact.reply", { ref: KEY });
  });

  it("says plainly when the mailbox is not connected", async () => {
    config.mockReturnValue(null);
    expect(await sendReplyAction(KEY, ADDRESS, "Hi")).toMatchObject({ ok: false, error: expect.stringMatching(/not connected/) });
  });

  it("reports a failed send and records nothing", async () => {
    send.mockRejectedValue(new Error("535 auth"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendReplyAction(KEY, ADDRESS, "Hi")).toMatchObject({ ok: false });
    expect(audit).not.toHaveBeenCalled();
  });

  it("refuses an empty answer", async () => {
    expect(await sendReplyAction(KEY, ADDRESS, "   ")).toMatchObject({ ok: false });
  });
});

describe("deleteConversationAction", () => {
  it("moves their mails to Trash before deleting the form messages", async () => {
    expect(await deleteConversationAction(KEY, ADDRESS)).toEqual({ ok: true });
    expect(imap.trashInbox).toHaveBeenCalledWith({}, expect.anything(), [7]);
    expect(db.contactSubmission.deleteMany).toHaveBeenCalledWith({ where: { email: { equals: ADDRESS, mode: "insensitive" } } });
  });

  it("deletes nothing when the mailbox cannot be reached", async () => {
    imap.withMailbox.mockRejectedValue(new Error("timeout"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await deleteConversationAction(KEY, ADDRESS)).toMatchObject({ ok: false });
    expect(db.contactSubmission.deleteMany).not.toHaveBeenCalled();
  });
});

describe("setDoneAction", () => {
  it("files and unfiles a conversation by its key", async () => {
    await setDoneAction(KEY, true);
    expect(db.mailConversation.upsert).toHaveBeenCalledWith({ where: { key: KEY }, create: { key: KEY, archivedAt: expect.any(Date) }, update: { archivedAt: expect.any(Date) } });
    await setDoneAction("not-a-key", true);
    expect(db.mailConversation.upsert).toHaveBeenCalledTimes(1);
  });
});

describe("reading and unreading", () => {
  it("marks their unseen mail read in the mailbox and their form messages read", async () => {
    imap.conversationHeaders.mockResolvedValue([{ ...theirMail, seen: false }, { ...theirMail, uid: 8, seen: true }]);
    await markConversationReadAction(KEY, ADDRESS);
    expect(imap.setSeen).toHaveBeenCalledWith({}, expect.anything(), [7], true);
    expect(db.contactSubmission.updateMany).toHaveBeenCalledWith({ where: { email: { equals: ADDRESS, mode: "insensitive" }, read: false }, data: { read: true } });
  });

  it("marks the latest mail from them unread when it is newer than their form message", async () => {
    db.contactSubmission.findFirst.mockResolvedValue({ id: "f1", createdAt: new Date("2026-01-01") });
    expect(await markUnreadAction(KEY, ADDRESS)).toEqual({ ok: true });
    expect(imap.setSeen).toHaveBeenCalledWith({}, expect.anything(), [7], false);
    expect(db.contactSubmission.update).not.toHaveBeenCalled();
  });

  it("marks the form message unread when nothing came by mail", async () => {
    imap.conversationHeaders.mockResolvedValue([]);
    db.contactSubmission.findFirst.mockResolvedValue({ id: "f1", createdAt: new Date("2026-01-01") });
    await markUnreadAction(KEY, ADDRESS);
    expect(db.contactSubmission.update).toHaveBeenCalledWith({ where: { id: "f1" }, data: { read: false } });
  });
});

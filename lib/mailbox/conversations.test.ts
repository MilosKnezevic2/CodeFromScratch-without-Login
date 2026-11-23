import { describe, expect, it } from "vitest";
import { baseSubject, buildConversations, conversationKey, isConversationKey, quoteFor, replySubject, splitQuoted, type FormMessage, type MailHeader } from "./conversations";

const self = new Set(["office@codefromscratch.org", "hello@codefromscratch.org"]);
const day = (d: number) => new Date(Date.UTC(2026, 10, d, 10));

let uid = 0;
const mail = (folder: "inbox" | "sent", from: string, to: string, d: number, extra: Partial<MailHeader> = {}): MailHeader => ({
  folder,
  uid: ++uid,
  messageId: `<m${uid}@x>`,
  references: [],
  from: { name: from.startsWith("olivia") ? "Olivia Bennett" : "", address: from },
  to: [{ name: "", address: to }],
  replyTo: [],
  subject: "Typo in the CSS Grid article",
  date: day(d),
  seen: true,
  ...extra,
});

const form = (email: string, d: number, extra: Partial<FormMessage> = {}): FormMessage => ({
  id: `f${d}`,
  name: "Olivia Bennett",
  email,
  subject: "Typo in the CSS Grid article",
  message: "There is a typo.",
  read: true,
  createdAt: day(d),
  ...extra,
});

describe("buildConversations", () => {
  it("puts the form message, their emails and our replies with one person into one conversation, oldest first", () => {
    const [c, ...rest] = buildConversations({
      forms: [form("Olivia@Example.com", 1)],
      mails: [mail("sent", "office@codefromscratch.org", "olivia@example.com", 2), mail("inbox", "olivia@example.com", "office@codefromscratch.org", 3, { subject: "Re: Typo in the CSS Grid article" })],
      self,
      archived: new Map(),
    });
    expect(rest).toEqual([]);
    expect(c.address).toBe("olivia@example.com");
    expect(c.items.map((i) => i.kind)).toEqual(["form", "out", "in"]);
    expect(c.status).toBe("waiting");
    expect(c.key).toBe(conversationKey("olivia@example.com"));
  });

  it("leaves out mail the site sends itself: form notifications and newsletter copies", () => {
    const list = buildConversations({ forms: [], mails: [mail("inbox", "hello@codefromscratch.org", "office@codefromscratch.org", 1)], self, archived: new Map() });
    expect(list).toEqual([]);
  });

  it("is New while something from them is unread, Replied when we spoke last, Done when filed after the last message", () => {
    const base = { forms: [], self, archived: new Map<string, Date>() };
    const unread = buildConversations({ ...base, mails: [mail("inbox", "ana@example.com", "office@codefromscratch.org", 1, { seen: false })] })[0];
    expect([unread.status, unread.unread]).toEqual(["new", 1]);
    const replied = buildConversations({ ...base, mails: [mail("inbox", "ana@example.com", "office@codefromscratch.org", 1), mail("sent", "office@codefromscratch.org", "ana@example.com", 2)] })[0];
    expect(replied.status).toBe("replied");
    const key = conversationKey("ana@example.com");
    const done = buildConversations({ ...base, archived: new Map([[key, day(5)]]), mails: [mail("inbox", "ana@example.com", "office@codefromscratch.org", 1)] })[0];
    expect(done.status).toBe("done");
    // A message that arrives after it was filed brings it back.
    const back = buildConversations({ ...base, archived: new Map([[key, day(5)]]), mails: [mail("inbox", "ana@example.com", "office@codefromscratch.org", 6)] })[0];
    expect(back.status).toBe("waiting");
  });

  it("names the conversation after the person, not after how we addressed them, and marks Write for us pitches", () => {
    const [c] = buildConversations({
      forms: [form("olivia@example.com", 1, { subject: "Write for us: React forms" })],
      mails: [mail("sent", "office@codefromscratch.org", "olivia@example.com", 2, { to: [{ name: "Dear Olivia", address: "olivia@example.com" }] })],
      self,
      archived: new Map(),
    });
    expect(c.name).toBe("Olivia Bennett");
    expect(c.pitch).toBe(true);
  });

  it("sorts the newest conversation first", () => {
    const list = buildConversations({
      forms: [form("old@example.com", 1), form("new@example.com", 9)],
      mails: [],
      self,
      archived: new Map(),
    });
    expect(list.map((c) => c.address)).toEqual(["new@example.com", "old@example.com"]);
  });
});

describe("subjects", () => {
  it("strips reply and forward prefixes in several languages", () => {
    expect(baseSubject("Re: RE: Fwd: AW: Hello")).toBe("Hello");
    expect(replySubject("Re: Hello")).toBe("Re: Hello");
    expect(replySubject("")).toBe("Re: Your message to CodeFromScratch");
  });
});

describe("splitQuoted", () => {
  it("keeps what they wrote and folds the quoted history away", () => {
    const text = "Thanks, that fixed it!\n\nOn 23 Nov 2026, CodeFromScratch wrote:\n> Hi Olivia,\n> try this";
    expect(splitQuoted(text)).toEqual({ body: "Thanks, that fixed it!", quoted: "On 23 Nov 2026, CodeFromScratch wrote:\n> Hi Olivia,\n> try this" });
  });

  it("leaves a mail without history alone, and does not fold a quote in the middle", () => {
    expect(splitQuoted("Just one line.").quoted).toBe("");
    const middle = "As the docs say:\n> keys must be stable\nso I used the slug.";
    expect(splitQuoted(middle)).toEqual({ body: middle, quoted: "" });
  });
});

describe("quoteFor", () => {
  it("quotes every line under who wrote it and when", () => {
    expect(quoteFor("a\nb", "Olivia", day(1))).toBe("On 1 Nov 2026, 11:00, Olivia wrote:\n> a\n> b");
  });
});

describe("conversation keys", () => {
  it("do not depend on letter case and do not reveal the address", () => {
    const key = conversationKey("Olivia@Example.com");
    expect(key).toBe(conversationKey("olivia@example.com"));
    expect(key).not.toContain("olivia");
    expect(isConversationKey(key)).toBe(true);
    expect(isConversationKey("../etc/passwd")).toBe(false);
  });
});

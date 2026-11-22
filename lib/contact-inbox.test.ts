import { describe, expect, it } from "vitest";
import { age, inboxKind, inboxStatus, isMessageId, replyLink } from "./contact-inbox";

const sent = new Date("2026-03-16T14:05:00Z");

describe("inboxStatus", () => {
  it("is New only until the message is opened", () => {
    expect(inboxStatus({ read: false, repliedAt: null, archivedAt: null })).toBe("new");
    expect(inboxStatus({ read: true, repliedAt: null, archivedAt: null })).toBe("read");
  });

  it("shows replied and done over read", () => {
    expect(inboxStatus({ read: true, repliedAt: sent, archivedAt: null })).toBe("replied");
    expect(inboxStatus({ read: true, repliedAt: sent, archivedAt: sent })).toBe("done");
  });
});

describe("age", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  it("says how long a message has waited", () => {
    expect(age(sent, now)).toBe("8 months ago");
    expect(age(new Date("2026-11-22T12:00:00Z"), now)).toBe("1 day ago");
    expect(age(new Date("2026-11-23T11:59:30Z"), now)).toBe("just now");
    expect(age(new Date("2024-11-01T12:00:00Z"), now)).toBe("2 years ago");
    // Two days minus a few seconds is still two days, not one.
    expect(age(new Date("2026-11-21T12:00:05Z"), now)).toBe("2 days ago");
  });
});

describe("inboxKind", () => {
  it("tells Write for us pitches from contact messages", () => {
    expect(inboxKind("Write for us: React hooks")).toBe("pitch");
    expect(inboxKind("Question")).toBe("contact");
    expect(inboxKind(null)).toBe("contact");
  });
});

describe("replyLink", () => {
  const message = { name: "Olivia Bennett", email: "olivia+cfs@example.com", subject: "Typo in an article", message: "Hi,\nthere is a typo & more.", createdAt: sent };

  it("starts an answer to the sender, with the message quoted", () => {
    const url = new URL(replyLink(message));
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe("olivia%2Bcfs@example.com");
    expect(url.searchParams.get("subject")).toBe("Re: Typo in an article");
    const body = url.searchParams.get("body")!;
    expect(body.startsWith("Hi Olivia,")).toBe(true);
    expect(body).toContain("Olivia Bennett wrote:\r\n> Hi,\r\n> there is a typo & more.");
  });

  it("keeps the link short enough for mail programs", () => {
    const long = replyLink({ ...message, subject: null, message: "x".repeat(10_000) });
    expect(long.length).toBeLessThan(2000 * 3);
    expect(new URL(long).searchParams.get("subject")).toBe("Re: Your message to CodeFromScratch");
    expect(new URL(long).searchParams.get("body")).toContain("[…]");
  });

  it("cannot be turned into extra headers by the sender's address or subject", () => {
    const url = replyLink({ ...message, email: "a@b.co?bcc=x@evil.example", subject: "x&cc=y@evil.example" });
    expect(new URL(url).searchParams.get("bcc")).toBeNull();
    expect(new URL(url).searchParams.get("cc")).toBeNull();
  });
});

describe("isMessageId", () => {
  it("accepts Prisma ids only", () => {
    expect(isMessageId("cmh2q8v7x0000a1b2c3d4e5f6")).toBe(true);
    expect(isMessageId("1 OR 1=1")).toBe(false);
    expect(isMessageId(42)).toBe(false);
  });
});

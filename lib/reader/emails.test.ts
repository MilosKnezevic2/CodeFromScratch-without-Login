import { beforeEach, describe, expect, it, vi } from "vitest";
import { emailOffLinks, emailOffToken, reminderEmail, replyEmail, verifyEmailOff } from "./emails";

beforeEach(() => {
  vi.stubEnv("NEXTAUTH_SECRET", "s".repeat(48));
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://codefromscratch.org");
});

describe("turn-off links", () => {
  it("work only for the reader and the email they were made for", () => {
    const t = emailOffToken("cm123abc456def", "replies");
    expect(verifyEmailOff("cm123abc456def", "replies", t)).toEqual({ userId: "cm123abc456def", kind: "replies" });
    expect(verifyEmailOff("cm123abc456deg", "replies", t)).toBeNull();
    expect(verifyEmailOff("cm123abc456def", "reminder", t)).toBeNull();
    expect(verifyEmailOff("cm123abc456def", "replies", `${t}x`)).toBeNull();
    expect(verifyEmailOff("cm123abc456def", "everything", t)).toBeNull();
  });

  it("change when the secret changes", () => {
    const before = emailOffToken("cm123abc456def", "reminder");
    vi.stubEnv("NEXTAUTH_SECRET", "t".repeat(48));
    expect(emailOffToken("cm123abc456def", "reminder")).not.toBe(before);
  });

  it("point the footer at a page with a button and the mail client at the one-click route", () => {
    const links = emailOffLinks("cm123abc456def", "reminder");
    expect(links.page).toMatch(/^https:\/\/codefromscratch\.org\/email-off\?u=cm123abc456def&k=reminder&t=/);
    expect(links.oneClick).toMatch(/^https:\/\/codefromscratch\.org\/api\/me\/email-off\?/);
  });
});

describe("replyEmail", () => {
  it("escapes what readers wrote", () => {
    const e = replyEmail({
      replierName: "<b>Ana</b>",
      postTitle: "Zod",
      replyUrl: "https://codefromscratch.org/blog/zod#comment-1",
      reply: "Try <script>alert(1)</script>",
      original: "Why?",
      offUrl: "https://codefromscratch.org/email-off?u=x",
    });
    expect(e.subject).toBe("<b>Ana</b> replied to your comment");
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.html).toContain("Turn reply emails off");
  });
});

describe("reminderEmail", () => {
  const base = { firstName: "Milos", thisWeek: 1, goal: 3, streak: 2, dashboardUrl: "https://x/dashboard", offUrl: "https://x/off" };

  it("is not sent when there is nothing to remind of", () => {
    expect(reminderEmail({ ...base, unfinished: [], saved: [] })).toBeNull();
  });

  it("names the unfinished articles and what keeps the streak", () => {
    const e = reminderEmail({ ...base, unfinished: [{ title: "Prisma vs Drizzle", url: "https://x/blog/p", note: "40% read · 7 min left" }], saved: [] });
    expect(e?.subject).toBe("You left an article half-read");
    expect(e?.text).toContain("1 of 3 articles this week. 2 more before Monday keeps your 2-week streak.");
    expect(e?.html).toContain("Prisma vs Drizzle");
    expect(e?.html).toContain("Turn the Sunday reminder off");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ findMany: vi.fn(), send: vi.fn(), cards: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { postComment: { findMany: m.findMany } } }));
vi.mock("@/lib/send-email", () => ({ sendEmail: m.send }));
vi.mock("@/lib/sanity/queries", () => ({ getPostCards: m.cards, getDeskPosts: vi.fn() }));

const { notifyReplies } = await import("./notify");

const reply = (over: Record<string, unknown> = {}, parent: Record<string, unknown> = {}, parentUser: Record<string, unknown> = {}) => ({
  id: "r1",
  postSlug: "zod",
  body: "Because keys survive reordering.",
  userId: "ana",
  user: { name: "Ana" },
  parent: {
    body: "Why keys?",
    deletedAt: null,
    status: "APPROVED",
    userId: "milos",
    user: { email: "milos@example.com", notifyReplies: true, banned: false, ...parentUser },
    ...parent,
  },
  ...over,
});

beforeEach(() => {
  vi.stubEnv("NEXTAUTH_SECRET", "s".repeat(48));
  m.findMany.mockReset();
  m.send.mockReset().mockResolvedValue({ id: "e1" });
  m.cards.mockResolvedValue(new Map([["zod", { title: "Zod at the Trust Boundary" }]]));
});

describe("notifyReplies", () => {
  it("emails the author of the answered comment, with a one-click turn-off header", async () => {
    m.findMany.mockResolvedValue([reply()]);
    expect(await notifyReplies(["r1"])).toBe(1);
    const mail = m.send.mock.calls[0][0];
    expect(mail.to).toBe("milos@example.com");
    expect(mail.subject).toBe("Ana replied to your comment");
    expect(mail.html).toContain("/blog/zod#comment-r1");
    expect(mail.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("stays quiet for replies to yourself, switched-off readers, banned readers and removed comments", async () => {
    m.findMany.mockResolvedValue([
      reply({ userId: "milos" }),
      reply({}, {}, { notifyReplies: false }),
      reply({}, {}, { banned: true }),
      reply({}, { deletedAt: new Date() }),
    ]);
    expect(await notifyReplies(["r1"])).toBe(0);
    expect(m.send).not.toHaveBeenCalled();
  });

  it("asks only for published replies", async () => {
    m.findMany.mockResolvedValue([]);
    await notifyReplies(["r1"]);
    expect(m.findMany.mock.calls[0][0].where).toMatchObject({ status: "APPROVED", deletedAt: null, parentId: { not: null } });
  });

  it("keeps going when one email fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    m.findMany.mockResolvedValue([reply(), reply({ id: "r2" })]);
    m.send.mockRejectedValueOnce(new Error("quota"));
    expect(await notifyReplies(["r1", "r2"])).toBe(1);
  });
});

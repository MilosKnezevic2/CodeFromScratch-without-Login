import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  articleDraft: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
}));
const reader = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/comments-store", () => ({ currentReader: reader }));

import { currentAuthor, deleteOwnDraft, getOwnDraft, parseDraftInput, readyForReview, saveOwnDraft, submitOwnDraft } from "./drafts";

const LONG = [{ _type: "block", _key: "b1", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s1", text: "word ".repeat(400), marks: [] }] }];

beforeEach(() => {
  for (const group of Object.values(db)) for (const fn of Object.values(group)) fn.mockReset();
  reader.mockReset();
});

describe("currentAuthor", () => {
  it("is null without a session, for a reader, and for an admin user role", async () => {
    reader.mockResolvedValue(null);
    expect(await currentAuthor()).toBeNull();
    reader.mockResolvedValue({ id: "u1", name: "Emily", email: "e@example.com" });
    db.user.findUnique.mockResolvedValue({ role: "USER" });
    expect(await currentAuthor()).toBeNull();
    db.user.findUnique.mockResolvedValue({ role: "ADMIN" });
    expect(await currentAuthor()).toBeNull();
  });

  it("is the user when the database says AUTHOR", async () => {
    reader.mockResolvedValue({ id: "u1", name: "Emily", email: "e@example.com" });
    db.user.findUnique.mockResolvedValue({ role: "AUTHOR" });
    expect(await currentAuthor()).toEqual({ id: "u1", name: "Emily" });
  });
});

describe("every query is scoped to the author", () => {
  it("reads a draft only together with its authorId", async () => {
    await getOwnDraft("u1", "d1");
    expect(db.articleDraft.findFirst).toHaveBeenCalledWith({ where: { id: "d1", authorId: "u1" } });
  });

  it("saves only own drafts that are still editable", async () => {
    db.articleDraft.updateMany.mockResolvedValue({ count: 0 });
    expect(await saveOwnDraft("u1", "d1", { title: "t", excerpt: "", body: [] })).toBe(false);
    expect(db.articleDraft.updateMany.mock.calls[0][0].where).toEqual({ id: "d1", authorId: "u1", status: { in: ["WRITING", "CHANGES_REQUESTED"] } });
  });

  it("deletes only an own draft that was never sent", async () => {
    db.articleDraft.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteOwnDraft("u1", "d1")).toBe(true);
    expect(db.articleDraft.deleteMany).toHaveBeenCalledWith({ where: { id: "d1", authorId: "u1", status: "WRITING" } });
  });
});

describe("submitOwnDraft", () => {
  it("refuses a draft that is locked or not theirs", async () => {
    db.articleDraft.findFirst.mockResolvedValue(null);
    expect(await submitOwnDraft("u1", "d1")).toEqual({ error: expect.stringContaining("cannot be sent") });
    expect(db.articleDraft.updateMany).not.toHaveBeenCalled();
  });

  it("refuses a draft that is not ready, and says what is missing", async () => {
    db.articleDraft.findFirst.mockResolvedValue({ title: "Short", excerpt: "", body: [] });
    expect(await submitOwnDraft("u1", "d1")).toEqual({ error: expect.stringContaining("title") });
  });

  it("moves a ready draft to IN_REVIEW, and only that", async () => {
    db.articleDraft.findFirst.mockResolvedValue({ title: "Out-of-order search results", excerpt: "Why older answers overwrite newer ones and how to stop it.", body: LONG });
    db.articleDraft.updateMany.mockResolvedValue({ count: 1 });
    expect(await submitOwnDraft("u1", "d1")).toEqual({ ok: true, title: "Out-of-order search results" });
    const call = db.articleDraft.updateMany.mock.calls[0][0];
    expect(call.where).toMatchObject({ id: "d1", authorId: "u1" });
    expect(Object.keys(call.data).sort()).toEqual(["status", "submittedAt"]);
    expect(call.data.status).toBe("IN_REVIEW");
  });
});

describe("parseDraftInput and readyForReview", () => {
  it("limits field lengths and ignores unknown fields such as status", () => {
    expect(parseDraftInput({ title: "x".repeat(121) })).toMatchObject({ ok: false });
    const parsed = parseDraftInput({ title: "  T  ", excerpt: "E", body: [], status: "APPROVED", authorId: "someone-else" });
    expect(parsed).toEqual({ ok: true, value: { title: "T", excerpt: "E", body: [] } });
  });

  it("refuses a body the editor could not have produced", () => {
    expect(parseDraftInput({ title: "T", body: [{ _type: "script", _key: "x" }] })).toMatchObject({ ok: false });
  });

  it("accepts a complete draft", () => {
    expect(readyForReview({ title: "A proper title here", excerpt: "A summary that is long enough to pass the check.", body: LONG })).toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ articleDraft: { findFirst: vi.fn(), updateMany: vi.fn() } }));
const admin = vi.hoisted(() => vi.fn());
const createSanityDraft = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/admin-guard", () => ({ isAdminRequest: admin }));
vi.mock("@/lib/audit", () => ({ recordAudit: vi.fn() }));
vi.mock("@/lib/writer/sanity", () => ({ createSanityDraft }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { approveAction } from "./actions";

const DRAFT = { id: "d1", title: "A title", excerpt: "An excerpt", body: [], author: { id: "u1", name: "Olivia" } };

beforeEach(() => {
  db.articleDraft.findFirst.mockReset();
  db.articleDraft.updateMany.mockReset();
  createSanityDraft.mockReset();
  admin.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("approveAction", () => {
  it("does nothing without an admin session", async () => {
    admin.mockResolvedValue(false);
    expect(await approveAction("d1")).toMatchObject({ ok: false });
    expect(createSanityDraft).not.toHaveBeenCalled();
  });

  it("creates the Sanity draft before it marks the draft approved", async () => {
    admin.mockResolvedValue(true);
    db.articleDraft.findFirst.mockResolvedValue(DRAFT);
    const order: string[] = [];
    createSanityDraft.mockImplementation(async () => order.push("sanity"));
    db.articleDraft.updateMany.mockImplementation(async () => (order.push("approved"), { count: 1 }));
    expect(await approveAction("d1")).toEqual({ ok: true });
    expect(order).toEqual(["sanity", "approved"]);
    expect(createSanityDraft).toHaveBeenCalledWith({ id: "d1", title: "A title", excerpt: "An excerpt", body: [] }, { id: "u1", name: "Olivia" });
  });

  it("leaves the draft in review when Sanity fails", async () => {
    admin.mockResolvedValue(true);
    db.articleDraft.findFirst.mockResolvedValue(DRAFT);
    createSanityDraft.mockRejectedValue(new Error("403"));
    expect(await approveAction("d1")).toMatchObject({ ok: false });
    expect(db.articleDraft.updateMany).not.toHaveBeenCalled();
  });

  it("refuses a draft that is not in review", async () => {
    admin.mockResolvedValue(true);
    db.articleDraft.findFirst.mockResolvedValue(null);
    expect(await approveAction("d1")).toMatchObject({ ok: false });
    expect(createSanityDraft).not.toHaveBeenCalled();
  });
});

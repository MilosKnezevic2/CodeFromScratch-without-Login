import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  reader: vi.fn(),
  slugs: vi.fn(),
  user: { findUnique: vi.fn() },
  history: { upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
  saved: { upsert: vi.fn(), deleteMany: vi.fn(), count: vi.fn(), findMany: vi.fn() },
  folder: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
  link: { upsert: vi.fn(), deleteMany: vi.fn() },
  day: { upsert: vi.fn() },
}));
vi.mock("@/lib/comments-store", () => ({ currentReader: m.reader }));
vi.mock("@/lib/analytics/store", () => ({ publishedSlugs: m.slugs }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ success: true, remaining: 1 }) }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: m.user, readingHistory: m.history, savedPost: m.saved, collection: m.folder, savedPostCollection: m.link, readingDay: m.day },
}));

import { POST as reading } from "./reading/route";
import { POST as saved } from "./saved/route";
import { POST as folders } from "./folders/route";

const req = (body: unknown) => new Request("https://codefromscratch.org/api/me/x", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  m.reader.mockResolvedValue({ id: "u1", name: "Emily", email: "emily@example.com" });
  m.slugs.mockResolvedValue(new Set(["zod"]));
  m.user.findUnique.mockResolvedValue({ trackReading: true });
  m.saved.upsert.mockResolvedValue({ id: "s1" });
  m.saved.count.mockResolvedValue(0);
  m.folder.count.mockResolvedValue(0);
});

describe("POST /api/me/reading", () => {
  it("needs a signed-in reader", async () => {
    m.reader.mockResolvedValue(null);
    expect((await reading(req({ slug: "zod", percent: 10 }))).status).toBe(401);
  });

  it("stores nothing when the reader switched tracking off", async () => {
    m.user.findUnique.mockResolvedValue({ trackReading: false });
    const res = await reading(req({ slug: "zod", percent: 50, seconds: 20 }));
    expect(await res.json()).toEqual({ ok: true, tracked: false });
    expect(m.history.upsert).not.toHaveBeenCalled();
  });

  it("adds the time, keeps the furthest point and stamps read once", async () => {
    await reading(req({ slug: "zod", percent: 95, seconds: 300 }));
    const call = m.history.upsert.mock.calls[0][0];
    expect(call.update).toMatchObject({ lastPercent: 95, secondsRead: { increment: 120 } });
    expect(m.history.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", postSlug: "zod", scrollPercent: { lt: 95 } },
      data: { scrollPercent: 95 },
    });
    expect(m.history.updateMany.mock.calls[1][0].where).toMatchObject({ completedAt: null });
    // The same capped seconds go to today's row of the activity calendar.
    const day = m.day.upsert.mock.calls[0][0];
    expect(day.update).toEqual({ seconds: { increment: 120 } });
    expect(day.where.userId_day.day.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });

  it("refuses an article that is not published", async () => {
    expect((await reading(req({ slug: "made-up", percent: 10 }))).status).toBe(404);
  });
});

describe("POST /api/me/saved", () => {
  it("will not file an article in someone else's folder", async () => {
    m.folder.findFirst.mockResolvedValue(null);
    const res = await saved(req({ slug: "zod", action: "folder", folderId: "theirs" }));
    expect(res.status).toBe(404);
    expect(m.folder.findFirst).toHaveBeenCalledWith({ where: { id: "theirs", userId: "u1" }, select: { id: true } });
    expect(m.link.upsert).not.toHaveBeenCalled();
  });

  it("saves and unsaves only the reader's own rows", async () => {
    expect((await saved(req({ slug: "zod", action: "save" }))).status).toBe(200);
    expect(m.saved.upsert.mock.calls[0][0].create).toEqual({ userId: "u1", postSlug: "zod" });
    await saved(req({ slug: "zod", action: "unsave" }));
    expect(m.saved.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", postSlug: "zod" } });
  });

  it("caps the library", async () => {
    m.saved.count.mockResolvedValue(1000);
    expect((await saved(req({ slug: "zod", action: "save" }))).status).toBe(409);
  });
});

describe("POST /api/me/folders", () => {
  it("creates a tidy, unique folder and caps the count", async () => {
    m.folder.findFirst.mockResolvedValue(null);
    m.folder.findMany.mockResolvedValue([{ color: "teal" }]);
    m.folder.create.mockResolvedValue({ id: "f1", name: "Later" });
    expect((await folders(req({ name: "  Later  " }))).status).toBe(201);
    // A new folder takes the next colour, so it differs from the one before.
    expect(m.folder.create.mock.calls[0][0].data).toEqual({ userId: "u1", name: "Later", color: "amber" });
    m.folder.findMany.mockResolvedValue(Array.from({ length: 30 }, () => ({ color: "teal" })));
    expect((await folders(req({ name: "One more" }))).status).toBe(409);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  open: vi.fn(),
  reader: vi.fn(),
  list: vi.fn(),
  slugs: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  send: vi.fn(),
  findFirst: vi.fn(),
}));
vi.mock("@/lib/comments-store", () => ({ commentsOpen: m.open, currentReader: m.reader, listComments: m.list }));
vi.mock("@/lib/analytics/store", () => ({ publishedSlugs: m.slugs }));
vi.mock("@/lib/prisma", () => ({ prisma: { postComment: { count: m.count, create: m.create, findFirst: m.findFirst } } }));
vi.mock("@/lib/send-email", () => ({ sendEmail: m.send }));
vi.mock("@/lib/settings/store", () => ({
  getSettings: async () => ({ general: { contactEmail: "office@codefromscratch.org" }, features: { holdFirstComment: true } }),
}));

import { GET, POST } from "./route";

const params = (postSlug: string) => ({ params: Promise.resolve({ postSlug }) });
const post = (body: unknown) =>
  new Request("https://codefromscratch.org/api/comments/real-post", { method: "POST", body: JSON.stringify(body) });

describe("/api/comments/[postSlug]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.open.mockResolvedValue(true);
    m.reader.mockResolvedValue({ id: "u1", name: "Emily", email: "emily@example.com" });
    m.slugs.mockResolvedValue(new Set(["real-post"]));
    m.count.mockResolvedValue(0);
    m.create.mockResolvedValue({ id: "c1" });
    m.send.mockResolvedValue(undefined);
    m.list.mockResolvedValue([]);
  });

  it("lists nothing and touches no table while comments are closed", async () => {
    m.open.mockResolvedValue(false);
    const res = await GET(new Request("https://x/"), params("real-post"));
    expect(await res.json()).toEqual({ open: false, comments: [] });
    expect(m.list).not.toHaveBeenCalled();
  });

  it("refuses a malformed slug", async () => {
    expect((await GET(new Request("https://x/"), params("../etc"))).status).toBe(404);
    expect((await POST(post({ body: "hi there" }), params("../etc"))).status).toBe(404);
  });

  it("needs a signed-in reader", async () => {
    m.reader.mockResolvedValue(null);
    expect((await POST(post({ body: "hi there" }), params("real-post"))).status).toBe(401);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("refuses an article that does not exist", async () => {
    expect((await POST(post({ body: "hi there" }), params("made-up"))).status).toBe(404);
  });

  it("holds a first comment and tells the inbox", async () => {
    const res = await POST(post({ body: "  Great article  " }), params("real-post"));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "c1", status: "PENDING" });
    expect(m.create).toHaveBeenCalledWith({
      data: { postSlug: "real-post", userId: "u1", body: "Great article", status: "PENDING", parentId: null },
      select: { id: true },
    });
    expect(m.send).toHaveBeenCalledTimes(1);
    expect(m.send.mock.calls[0][0].html).not.toContain("<script");
  });

  it("publishes at once for a reader with an approved comment", async () => {
    m.count.mockImplementation(async (args: { where: { status?: string } }) => (args.where.status === "APPROVED" ? 1 : 0));
    const res = await POST(post({ body: "Second comment" }), params("real-post"));
    expect(await res.json()).toEqual({ id: "c1", status: "APPROVED" });
    expect(m.send).not.toHaveBeenCalled();
  });

  it("escapes markup in the notification", async () => {
    await POST(post({ body: "<script>alert(1)</script>" }), params("real-post"));
    expect(m.send.mock.calls[0][0].html).toContain("&lt;script&gt;");
  });

  it("limits bursts", async () => {
    m.count.mockResolvedValue(5);
    expect((await POST(post({ body: "again and again" }), params("real-post"))).status).toBe(429);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("refuses an empty body", async () => {
    expect((await POST(post({ body: " " }), params("real-post"))).status).toBe(400);
  });

  it("files a reply under a published comment of the same article", async () => {
    m.findFirst.mockResolvedValue({ id: "parent1" });
    const res = await POST(post({ body: "I agree", parentId: "parent1" }), params("real-post"));
    expect(res.status).toBe(201);
    expect(m.findFirst).toHaveBeenCalledWith({
      where: { id: "parent1", postSlug: "real-post", status: "APPROVED", deletedAt: null },
      select: { id: true },
    });
    expect(m.create.mock.calls[0][0].data.parentId).toBe("parent1");
  });

  it("refuses a reply to a comment that is not published here", async () => {
    m.findFirst.mockResolvedValue(null);
    expect((await POST(post({ body: "I agree", parentId: "elsewhere" }), params("real-post"))).status).toBe(400);
    expect((await POST(post({ body: "I agree", parentId: 42 }), params("real-post"))).status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("keeps the comment when the notification fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    m.send.mockRejectedValue(new Error("resend down"));
    expect((await POST(post({ body: "Still saved" }), params("real-post"))).status).toBe(201);
  });
});

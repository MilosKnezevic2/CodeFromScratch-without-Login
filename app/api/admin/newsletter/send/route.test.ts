import { describe, it, expect, beforeEach, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  newsletterSubscriber: { findMany: vi.fn(), findUnique: vi.fn() },
  newsletterCampaign: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
const batchMock = vi.hoisted(() => vi.fn());
const emailMock = vi.hoisted(() => vi.fn());
const guardMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/admin-guard", () => ({ isAdminRequest: guardMock }));
vi.mock("@/lib/resend", () => ({
  getResend: () => ({ batch: { send: batchMock }, emails: { send: emailMock } }),
  getEmailFrom: () => "CodeFromScratch <hello@codefromscratch.org>",
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ success: true, remaining: 9 }) }));
vi.mock("@/lib/sanity/queries", () => ({
  getPostBySlug: vi.fn(async (slug: string) =>
    slug === "real-post"
      ? { title: "Real post", slug: { current: "real-post" }, excerpt: "E", readingTime: 5 }
      : null,
  ),
}));
vi.mock("@/lib/sanity/image", () => ({ urlFor: vi.fn() }));

import { POST } from "./route";

function post(body: Record<string, unknown>): Request {
  return new Request("https://codefromscratch.org/api/admin/newsletter/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const letter = { subject: "Hello", postSlug: "real-post" };
const people = [
  { email: "a@example.com", unsubscribeToken: "tok-a" },
  { email: "b@example.com", unsubscribeToken: "tok-b" },
];

describe("POST /api/admin/newsletter/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guardMock.mockResolvedValue(true);
    prismaMock.newsletterSubscriber.findMany.mockResolvedValue(people);
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(null);
    prismaMock.newsletterCampaign.findFirst.mockResolvedValue(null);
    prismaMock.newsletterCampaign.create.mockResolvedValue({ id: "camp1" });
    prismaMock.newsletterCampaign.update.mockResolvedValue({});
    batchMock.mockResolvedValue({ data: { data: [{ id: "1" }, { id: "2" }], errors: [] }, error: null });
    emailMock.mockResolvedValue({ data: { id: "1" }, error: null });
  });

  it("refuses anyone who is not the admin, before reading anything", async () => {
    guardMock.mockResolvedValue(false);
    const res = await POST(post({ ...letter, mode: "all", confirmCount: 2 }));
    expect(res.status).toBe(403);
    expect(prismaMock.newsletterSubscriber.findMany).not.toHaveBeenCalled();
    expect(batchMock).not.toHaveBeenCalled();
  });

  it("rejects an article that does not exist", async () => {
    const res = await POST(post({ subject: "Hi", postSlug: "ghost", mode: "all", confirmCount: 2 }));
    expect(res.status).toBe(400);
    expect(batchMock).not.toHaveBeenCalled();
  });

  describe("test mode", () => {
    it("mails only the test address, marks it as a test, and touches no campaign", async () => {
      const res = await POST(post({ ...letter, mode: "test", testEmail: "Me@Example.com" }));
      expect(res.status).toBe(200);
      expect(emailMock).toHaveBeenCalledTimes(1);
      const mail = emailMock.mock.calls[0]![0];
      expect(mail.to).toBe("me@example.com");
      expect(mail.subject).toBe("[TEST] Hello");
      expect(batchMock).not.toHaveBeenCalled();
      expect(prismaMock.newsletterSubscriber.findMany).not.toHaveBeenCalled();
      expect(prismaMock.newsletterCampaign.create).not.toHaveBeenCalled();
    });

    it("uses the real unsubscribe link when the test address is subscribed", async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue({
        confirmed: true,
        unsubscribeToken: "my-token",
      });
      await POST(post({ ...letter, mode: "test", testEmail: "me@example.com" }));
      const mail = emailMock.mock.calls[0]![0];
      expect(mail.html).toContain("token=my-token");
      expect(mail.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    });

    it("rejects a bad test address and reports a failed send", async () => {
      expect((await POST(post({ ...letter, mode: "test", testEmail: "nope" }))).status).toBe(400);
      emailMock.mockResolvedValue({ data: null, error: { name: "quota", message: "over" } });
      expect((await POST(post({ ...letter, mode: "test", testEmail: "me@example.com" }))).status).toBe(502);
    });
  });

  describe("send to all", () => {
    it("only asks the database for confirmed subscribers", async () => {
      await POST(post({ ...letter, mode: "all", confirmCount: 2 }));
      expect(prismaMock.newsletterSubscriber.findMany.mock.calls[0]![0].where).toEqual({ confirmed: true });
    });

    it("gives each person their own unsubscribe link and one-click headers", async () => {
      const res = await POST(post({ ...letter, mode: "all", confirmCount: 2 }));
      expect(res.status).toBe(200);
      const [payload, options] = batchMock.mock.calls[0]!;
      expect(payload).toHaveLength(2);
      expect(payload[0].to).toBe("a@example.com");
      expect(payload[0].html).toContain("token=tok-a");
      expect(payload[0].html).not.toContain("tok-b");
      expect(payload[1].html).toContain("token=tok-b");
      expect(payload[0].text).toContain("token=tok-a");
      expect(payload[0].headers["List-Unsubscribe"]).toContain("/api/newsletter/unsubscribe?token=tok-a");
      expect(payload[0].headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
      expect(options.idempotencyKey).toBe("campaign-camp1-0");
    });

    it("stops when the typed number does not match the list", async () => {
      const res = await POST(post({ ...letter, mode: "all", confirmCount: 5 }));
      expect(res.status).toBe(409);
      expect(batchMock).not.toHaveBeenCalled();
      expect(prismaMock.newsletterCampaign.create).not.toHaveBeenCalled();
    });

    it("stops when no number was sent at all", async () => {
      expect((await POST(post({ ...letter, mode: "all" }))).status).toBe(409);
      expect(batchMock).not.toHaveBeenCalled();
    });

    it("stops when another send is running or the same letter just went out", async () => {
      prismaMock.newsletterCampaign.findFirst.mockResolvedValueOnce({ id: "running" });
      expect((await POST(post({ ...letter, mode: "all", confirmCount: 2 }))).status).toBe(409);

      prismaMock.newsletterCampaign.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "duplicate" });
      expect((await POST(post({ ...letter, mode: "all", confirmCount: 2 }))).status).toBe(409);
      expect(batchMock).not.toHaveBeenCalled();
    });

    it("records a clean send", async () => {
      const body = await (await POST(post({ ...letter, mode: "all", confirmCount: 2 }))).json();
      expect(body).toEqual({ status: "SENT", sentCount: 2, failedCount: 0 });
      const update = prismaMock.newsletterCampaign.update.mock.calls[0]![0];
      expect(update.data).toMatchObject({ status: "SENT", sentCount: 2, failedCount: 0 });
    });

    it("records a partial send when Resend rejects an address", async () => {
      batchMock.mockResolvedValue({
        data: { data: [{ id: "1" }], errors: [{ index: 1, message: "bad" }] },
        error: null,
      });
      const body = await (await POST(post({ ...letter, mode: "all", confirmCount: 2 }))).json();
      expect(body).toEqual({ status: "PARTIAL", sentCount: 1, failedCount: 1 });
    });

    it("records a failure when Resend refuses the batch or the call throws", async () => {
      batchMock.mockResolvedValue({ data: null, error: { name: "quota", message: "over" } });
      let body = await (await POST(post({ ...letter, mode: "all", confirmCount: 2 }))).json();
      expect(body).toEqual({ status: "FAILED", sentCount: 0, failedCount: 2 });

      batchMock.mockRejectedValue(new Error("network"));
      body = await (await POST(post({ ...letter, mode: "all", confirmCount: 2 }))).json();
      expect(body).toEqual({ status: "FAILED", sentCount: 0, failedCount: 2 });
    });

    it("refuses to send to an empty list", async () => {
      prismaMock.newsletterSubscriber.findMany.mockResolvedValue([]);
      expect((await POST(post({ ...letter, mode: "all", confirmCount: 0 }))).status).toBe(400);
    });
  });
});

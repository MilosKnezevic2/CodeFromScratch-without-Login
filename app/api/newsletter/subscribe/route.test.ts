import { describe, it, expect, beforeEach, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  newsletterSubscriber: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}));
const sendMock = vi.hoisted(() => vi.fn());
const rateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/resend", () => ({
  getResend: () => ({ emails: { send: sendMock } }),
  getEmailFrom: () => "CodeFromScratch <hello@codefromscratch.org>",
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: rateLimitMock }));

import { POST } from "./route";

function post(body: Record<string, unknown>): Request {
  return new Request("https://codefromscratch.org/api/newsletter/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    prismaMock.newsletterSubscriber.findUnique.mockReset();
    prismaMock.newsletterSubscriber.upsert.mockReset();
    sendMock.mockReset();
    rateLimitMock.mockReset();
    rateLimitMock.mockReturnValue({ success: true, remaining: 4 });
  });

  it("rate-limits before doing anything else", async () => {
    rateLimitMock.mockReturnValue({ success: false, remaining: 0 });
    const res = await POST(post({ email: "reader@example.com" }));
    expect(res.status).toBe(429);
    expect(prismaMock.newsletterSubscriber.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const res = await POST(post({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns the same neutral message for a brand-new address…", async () => {
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(null);
    prismaMock.newsletterSubscriber.upsert.mockResolvedValue({});
    sendMock.mockResolvedValue({});
    const res = await POST(post({ email: "new@example.com" }));
    const fresh = await res.json();

    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue({
      email: "old@example.com",
      confirmed: true,
    });
    const res2 = await POST(post({ email: "old@example.com" }));
    const confirmed = await res2.json();

    // …as for an already-confirmed one: no membership probe possible.
    expect(res.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(fresh.message).toBe(confirmed.message);
  });

  it("does not email an already-confirmed address", async () => {
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue({
      email: "old@example.com",
      confirmed: true,
    });
    await POST(post({ email: "old@example.com" }));
    expect(sendMock).not.toHaveBeenCalled();
    expect(prismaMock.newsletterSubscriber.upsert).not.toHaveBeenCalled();
  });

  it("sends the confirmation email with a page link, not an API link", async () => {
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(null);
    prismaMock.newsletterSubscriber.upsert.mockResolvedValue({});
    sendMock.mockResolvedValue({});
    await POST(post({ email: "new@example.com" }));
    expect(sendMock).toHaveBeenCalledTimes(1);
    const html: string = sendMock.mock.calls[0]![0].html;
    expect(html).toContain("/newsletter/confirm?token=");
    expect(html).not.toContain("/api/newsletter/confirm");
  });

  it("stores only the hash of the confirm token", async () => {
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(null);
    prismaMock.newsletterSubscriber.upsert.mockResolvedValue({});
    sendMock.mockResolvedValue({});
    await POST(post({ email: "new@example.com" }));

    const upsertArgs = prismaMock.newsletterSubscriber.upsert.mock.calls[0]![0];
    const storedConfirm: string = upsertArgs.create.confirmToken;
    const html: string = sendMock.mock.calls[0]![0].html;
    expect(html).not.toContain(storedConfirm);
  });

  it("swallows bot submissions via the honeypot with a fake success", async () => {
    const res = await POST(
      post({ email: "bot@example.com", honeypot: "http://spam.example" }),
    );
    expect(res.status).toBe(200);
    expect(prismaMock.newsletterSubscriber.findUnique).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns a clean 500 when the database is down", async () => {
    prismaMock.newsletterSubscriber.findUnique.mockRejectedValue(
      new Error("connect ECONNREFUSED"),
    );
    const res = await POST(post({ email: "reader@example.com" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Something went wrong");
  });
});

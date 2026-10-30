import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

const prismaMock = vi.hoisted(() => ({
  newsletterSubscriber: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));
const sendMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/resend", () => ({
  getResend: () => ({ emails: { send: sendMock } }),
  getEmailFrom: () => "CodeFromScratch <hello@codefromscratch.org>",
}));
vi.mock("@/lib/sanity/queries", () => ({ getPostBySlug: vi.fn() }));
vi.mock("@/lib/sanity/image", () => ({ urlFor: vi.fn() }));

import { GET, POST } from "./route";

const RAW_TOKEN = "a".repeat(64);
const HASHED = crypto.createHash("sha256").update(RAW_TOKEN).digest("hex");

function post(token?: string): Request {
  return new Request("https://codefromscratch.org/api/newsletter/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(token === undefined ? {} : { token }),
  });
}

function subscriber(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    email: "reader@example.com",
    confirmed: false,
    confirmToken: HASHED,
    unsubscribeToken: "unsub-1",
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("GET /api/newsletter/confirm (legacy email links)", () => {
  it("redirects to the interstitial page without mutating", async () => {
    const res = await GET(
      new Request(`https://codefromscratch.org/api/newsletter/confirm?token=${RAW_TOKEN}`),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      `https://codefromscratch.org/newsletter/confirm?token=${RAW_TOKEN}`,
    );
    expect(prismaMock.newsletterSubscriber.update).not.toHaveBeenCalled();
  });
});

describe("POST /api/newsletter/confirm", () => {
  beforeEach(() => {
    prismaMock.newsletterSubscriber.findFirst.mockReset();
    prismaMock.newsletterSubscriber.update.mockReset();
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: "m1" }, error: null });
  });

  it("rejects a missing token", async () => {
    const res = await POST(post());
    expect(res.status).toBe(400);
  });

  it("looks the token up by its hash, not the raw value", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(subscriber());
    prismaMock.newsletterSubscriber.update.mockResolvedValue({});
    await POST(post(RAW_TOKEN));
    expect(prismaMock.newsletterSubscriber.findFirst).toHaveBeenCalledWith({
      where: { confirmToken: HASHED },
    });
  });

  it("confirms a fresh subscription", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(subscriber());
    prismaMock.newsletterSubscriber.update.mockResolvedValue({});
    const res = await POST(post(RAW_TOKEN));
    expect((await res.json()).status).toBe("confirmed");
    expect(prismaMock.newsletterSubscriber.update).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { confirmed: true, confirmedAt: expect.any(Date) },
    });
  });

  it("sends the welcome letter once, with the checklist and a real unsubscribe link", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(subscriber());
    prismaMock.newsletterSubscriber.update.mockResolvedValue({});
    await POST(post(RAW_TOKEN));

    expect(sendMock).toHaveBeenCalledTimes(1);
    const mail = sendMock.mock.calls[0]![0];
    expect(mail.to).toBe("reader@example.com");
    expect(mail.html).toContain("/production-checklist");
    expect(mail.html).toContain("/newsletter/unsubscribe?token=unsub-1");
    expect(mail.headers["List-Unsubscribe"]).toContain("/api/newsletter/unsubscribe?token=unsub-1");
    expect(mail.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("keeps the subscription when the welcome letter fails", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(subscriber());
    prismaMock.newsletterSubscriber.update.mockResolvedValue({});
    sendMock.mockResolvedValue({ data: null, error: { name: "quota", message: "over" } });
    const res = await POST(post(RAW_TOKEN));
    expect((await res.json()).status).toBe("confirmed");
    expect(prismaMock.newsletterSubscriber.update).toHaveBeenCalled();
  });

  it("does not send the welcome letter again on a repeat click", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(subscriber({ confirmed: true }));
    expect((await (await POST(post(RAW_TOKEN))).json()).status).toBe("already");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("is idempotent: a second click reports already-confirmed, not an error", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(
      subscriber({ confirmed: true }),
    );
    const res = await POST(post(RAW_TOKEN));
    expect((await res.json()).status).toBe("already");
    expect(prismaMock.newsletterSubscriber.update).not.toHaveBeenCalled();
  });

  it("expires tokens older than 7 days without confirming", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(
      subscriber({ updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }),
    );
    const res = await POST(post(RAW_TOKEN));
    expect((await res.json()).status).toBe("expired");
    expect(prismaMock.newsletterSubscriber.update).not.toHaveBeenCalled();
  });

  it("reports an unknown token as invalid", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(null);
    const res = await POST(post(RAW_TOKEN));
    expect((await res.json()).status).toBe("invalid");
  });

  it("returns a clean 500 status when the database is down", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockRejectedValue(
      new Error("connect ECONNREFUSED"),
    );
    const res = await POST(post(RAW_TOKEN));
    expect(res.status).toBe(500);
    expect((await res.json()).status).toBe("error");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

const prismaMock = vi.hoisted(() => ({
  newsletterSubscriber: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

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
      data: { confirmed: true },
    });
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

import { describe, it, expect, beforeEach, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  newsletterSubscriber: {
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { GET, POST } from "./route";

const TOKEN = "b".repeat(64);

describe("GET /api/newsletter/unsubscribe (legacy email links)", () => {
  it("redirects to the interstitial page without mutating", async () => {
    const res = await GET(
      new Request(`https://codefromscratch.org/api/newsletter/unsubscribe?token=${TOKEN}`),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      `https://codefromscratch.org/newsletter/unsubscribe?token=${TOKEN}`,
    );
    expect(prismaMock.newsletterSubscriber.delete).not.toHaveBeenCalled();
  });
});

describe("POST /api/newsletter/unsubscribe", () => {
  beforeEach(() => {
    prismaMock.newsletterSubscriber.findFirst.mockReset();
    prismaMock.newsletterSubscriber.delete.mockReset();
  });

  it("compares the link token to the stored value directly — regression for the double-hash bug that broke every campaign unsubscribe link", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue({ id: "sub_1" });
    prismaMock.newsletterSubscriber.delete.mockResolvedValue({});
    await POST(
      new Request("https://codefromscratch.org/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: TOKEN }),
      }),
    );
    expect(prismaMock.newsletterSubscriber.findFirst).toHaveBeenCalledWith({
      where: { unsubscribeToken: TOKEN },
    });
  });

  it("unsubscribes via JSON body", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue({ id: "sub_1" });
    prismaMock.newsletterSubscriber.delete.mockResolvedValue({});
    const res = await POST(
      new Request("https://codefromscratch.org/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: TOKEN }),
      }),
    );
    expect((await res.json()).status).toBe("unsubscribed");
    expect(prismaMock.newsletterSubscriber.delete).toHaveBeenCalledWith({
      where: { id: "sub_1" },
    });
  });

  it("supports RFC 8058 one-click: token in the URL, form-encoded body", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue({ id: "sub_1" });
    prismaMock.newsletterSubscriber.delete.mockResolvedValue({});
    const res = await POST(
      new Request(
        `https://codefromscratch.org/api/newsletter/unsubscribe?token=${TOKEN}`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "List-Unsubscribe=One-Click",
        },
      ),
    );
    expect((await res.json()).status).toBe("unsubscribed");
  });

  it("rejects a missing token", async () => {
    const res = await POST(
      new Request("https://codefromscratch.org/api/newsletter/unsubscribe", {
        method: "POST",
        body: "",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("reports an unknown token as invalid without deleting anything", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockResolvedValue(null);
    const res = await POST(
      new Request("https://codefromscratch.org/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: TOKEN }),
      }),
    );
    expect((await res.json()).status).toBe("invalid");
    expect(prismaMock.newsletterSubscriber.delete).not.toHaveBeenCalled();
  });

  it("returns a clean 500 status when the database is down", async () => {
    prismaMock.newsletterSubscriber.findFirst.mockRejectedValue(
      new Error("connect ECONNREFUSED"),
    );
    const res = await POST(
      new Request("https://codefromscratch.org/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: TOKEN }),
      }),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).status).toBe("error");
  });
});

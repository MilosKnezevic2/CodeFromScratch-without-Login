import { describe, it, expect, beforeEach, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  courseWaitlist: {
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
  return new Request("https://codefromscratch.org/api/waitlist/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/waitlist/subscribe", () => {
  beforeEach(() => {
    prismaMock.courseWaitlist.findUnique.mockReset();
    prismaMock.courseWaitlist.upsert.mockReset();
    sendMock.mockReset();
    rateLimitMock.mockReset();
    rateLimitMock.mockReturnValue({ success: true, remaining: 4 });
  });

  it("rate-limits before touching the database", async () => {
    rateLimitMock.mockReturnValue({ success: false, remaining: 0 });
    const res = await POST(post({ email: "a@example.com", level: "beginner" }));
    expect(res.status).toBe(429);
    expect(prismaMock.courseWaitlist.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an invalid email and an unknown level", async () => {
    expect((await POST(post({ email: "nope", level: "beginner" }))).status).toBe(400);
    expect((await POST(post({ email: "a@example.com", level: "wizard" }))).status).toBe(400);
    expect((await POST(post({ email: "a@example.com" }))).status).toBe(400);
  });

  it("swallows bot submissions via the honeypot", async () => {
    const res = await POST(post({ email: "bot@example.com", level: "beginner", honeypot: "x" }));
    expect(res.status).toBe(200);
    expect(prismaMock.courseWaitlist.findUnique).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("gives the same reply for new and already-confirmed addresses, and emails only the new one", async () => {
    prismaMock.courseWaitlist.findUnique.mockResolvedValue(null);
    prismaMock.courseWaitlist.upsert.mockResolvedValue({});
    sendMock.mockResolvedValue({});
    const fresh = await (await POST(post({ email: "new@example.com", level: "beginner" }))).json();
    expect(sendMock).toHaveBeenCalledTimes(1);

    prismaMock.courseWaitlist.findUnique.mockResolvedValue({ email: "old@example.com", confirmed: true });
    const known = await (await POST(post({ email: "old@example.com", level: "beginner" }))).json();
    expect(known.message).toBe(fresh.message);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("stores only the hash of the confirm token and links to the page, not the API", async () => {
    prismaMock.courseWaitlist.findUnique.mockResolvedValue(null);
    prismaMock.courseWaitlist.upsert.mockResolvedValue({});
    sendMock.mockResolvedValue({});
    await POST(post({ email: "new@example.com", level: "advanced", note: "  testing  " }));

    const args = prismaMock.courseWaitlist.upsert.mock.calls[0]![0];
    const html: string = sendMock.mock.calls[0]![0].html;
    expect(html).not.toContain(args.create.confirmToken);
    expect(html).toContain("/course-waitlist/confirm?token=");
    expect(html).toContain(`/course-waitlist/unsubscribe?token=${args.create.unsubscribeToken}`);
    expect(args.create.level).toBe("advanced");
    expect(args.create.note).toBe("testing");
  });

  it("truncates an over-long note", async () => {
    prismaMock.courseWaitlist.findUnique.mockResolvedValue(null);
    prismaMock.courseWaitlist.upsert.mockResolvedValue({});
    sendMock.mockResolvedValue({});
    await POST(post({ email: "new@example.com", level: "beginner", note: "x".repeat(1000) }));
    expect(prismaMock.courseWaitlist.upsert.mock.calls[0]![0].create.note).toHaveLength(300);
  });
});

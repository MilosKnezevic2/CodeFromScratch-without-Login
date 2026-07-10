import { describe, it, expect, beforeEach, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  contactSubmission: {
    create: vi.fn(),
  },
}));
const sendMock = vi.hoisted(() => vi.fn());
const rateLimitMock = vi.hoisted(() => vi.fn());
const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/resend", () => ({
  getResend: () => ({ emails: { send: sendMock } }),
  getEmailFrom: () => "CodeFromScratch <hello@codefromscratch.org>",
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: rateLimitMock }));

import { NextRequest } from "next/server";
import { POST } from "./route";

function post(body: Record<string, unknown>): NextRequest {
  return new NextRequest("https://codefromscratch.org/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID = {
  name: "Test Reader",
  email: "reader@example.com",
  subject: "Question",
  message: "A perfectly reasonable question about the article.",
};

describe("POST /api/contact", () => {
  beforeEach(() => {
    prismaMock.contactSubmission.create.mockReset();
    prismaMock.contactSubmission.create.mockResolvedValue({});
    sendMock.mockReset();
    sendMock.mockResolvedValue({});
    rateLimitMock.mockReset();
    rateLimitMock.mockReturnValue({ success: true, remaining: 2 });
    authMock.mockReset();
    authMock.mockResolvedValue(null);
  });

  it("rate-limits before doing anything else", async () => {
    rateLimitMock.mockReturnValue({ success: false, remaining: 0 });
    const res = await POST(post(VALID));
    expect(res.status).toBe(429);
    expect(prismaMock.contactSubmission.create).not.toHaveBeenCalled();
  });

  it("swallows bot submissions via the honeypot with a fake success", async () => {
    const res = await POST(post({ ...VALID, honeypot: "http://spam.example" }));
    expect(res.status).toBe(200);
    expect(prismaMock.contactSubmission.create).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("requires name, email, and message", async () => {
    const res = await POST(post({ email: VALID.email, message: VALID.message }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await POST(post({ ...VALID, email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("rejects a message under 10 characters", async () => {
    const res = await POST(post({ ...VALID, message: "short" }));
    expect(res.status).toBe(400);
  });

  it("stores and emails text verbatim — no HTML entities in a plain-text sink", async () => {
    // Regression: sanitizeHtml used to turn "O'Brien & Sons" into
    // "O&#039;Brien &amp; Sons" in both the admin portal and the email.
    const res = await POST(
      post({ ...VALID, name: "O'Brien", message: "Tom & Jerry <3 the article, honestly." }),
    );
    expect(res.status).toBe(200);

    const stored = prismaMock.contactSubmission.create.mock.calls[0]![0].data;
    expect(stored.name).toBe("O'Brien");
    expect(stored.message).toBe("Tom & Jerry <3 the article, honestly.");

    const emailText: string = sendMock.mock.calls[0]![0].text;
    expect(emailText).toContain("Tom & Jerry <3");
    expect(emailText).not.toContain("&amp;");
    expect(emailText).not.toContain("&#039;");
  });

  it("still succeeds when the notification email fails — the submission is already saved", async () => {
    sendMock.mockRejectedValue(new Error("resend down"));
    const res = await POST(post(VALID));
    expect(res.status).toBe(200);
    expect(prismaMock.contactSubmission.create).toHaveBeenCalledTimes(1);
  });

  it("returns a clean 500 when the database is down", async () => {
    prismaMock.contactSubmission.create.mockRejectedValue(
      new Error("connect ECONNREFUSED"),
    );
    const res = await POST(post(VALID));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Something went wrong.");
  });
});

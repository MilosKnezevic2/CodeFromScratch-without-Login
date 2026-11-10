import { describe, it, expect, beforeEach, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ contactSubmission: { create: vi.fn() } }));
const sendMock = vi.hoisted(() => vi.fn());
const rateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/resend", () => ({
  getResend: () => ({ emails: { send: sendMock } }),
  getEmailFrom: () => "CodeFromScratch <hello@codefromscratch.org>",
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: rateLimitMock }));

import { NextRequest } from "next/server";
import { POST } from "./route";

const PITCH =
  "Most tutorials stop at the happy path. I want to show how a beginner adds loading, error and empty states to a fetch call, why each one exists, and how to test them by hand.";

const VALID = {
  name: "Olivia Bennett",
  email: "Olivia@Example.com",
  experience: "working",
  topic: "Loading, error and empty states",
  pitch: PITCH,
  links: "https://github.com/example",
  consent: true,
};

function post(body: unknown): NextRequest {
  return new NextRequest("https://codefromscratch.org/api/write-for-us", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/write-for-us", () => {
  beforeEach(() => {
    prismaMock.contactSubmission.create.mockReset().mockResolvedValue({});
    sendMock.mockReset().mockResolvedValue({});
    rateLimitMock.mockReset().mockReturnValue({ success: true, remaining: 2 });
  });

  it("stores a valid pitch in the contact inbox and emails the office with reply-to set", async () => {
    const res = await POST(post(VALID));
    expect(res.status).toBe(200);
    const data = prismaMock.contactSubmission.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ name: "Olivia Bennett", email: "olivia@example.com", subject: "Write for us: Loading, error and empty states" });
    expect(data.message).toContain(PITCH);
    expect(data.message).toContain("I build things for a living");
    expect(sendMock.mock.calls[0][0]).toMatchObject({ to: "office@codefromscratch.org", replyTo: "olivia@example.com" });
  });

  it("rate-limits per address before reading the body", async () => {
    rateLimitMock.mockReturnValue({ success: false, remaining: 0 });
    const res = await POST(post(VALID));
    expect(res.status).toBe(429);
    expect(rateLimitMock).toHaveBeenCalledWith("write-for-us:203.0.113.7", 3, 3_600_000);
    expect(prismaMock.contactSubmission.create).not.toHaveBeenCalled();
  });

  it("gives bots a success that stores and sends nothing", async () => {
    const res = await POST(post({ ...VALID, honeypot: "http://spam.example" }));
    expect(res.status).toBe(200);
    expect(prismaMock.contactSubmission.create).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each([
    ["no consent", { consent: false }, /confirm/],
    ["an unknown experience value", { experience: "guru" }, /where you are/],
    ["a pitch that is too short", { pitch: "Too short." }, /more about the article/],
    ["a bad email", { email: "not-an-email" }, /valid email/],
    ["a missing title", { topic: "" }, /working title/],
  ])("refuses %s with a message that names the field", async (_label, change, message) => {
    const res = await POST(post({ ...VALID, ...change }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(message);
    expect(prismaMock.contactSubmission.create).not.toHaveBeenCalled();
  });

  it("refuses a body that is not a JSON object", async () => {
    expect((await POST(post("not json"))).status).toBe(400);
    expect((await POST(post([1, 2]))).status).toBe(400);
  });

  it("answers 503 when the database is down, without sending the email", async () => {
    prismaMock.contactSubmission.create.mockRejectedValue(new Error("db asleep"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(post(VALID));
    expect(res.status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("still succeeds when only the notification email fails", async () => {
    sendMock.mockRejectedValue(new Error("resend down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(post(VALID));
    expect(res.status).toBe(200);
    expect(prismaMock.contactSubmission.create).toHaveBeenCalledOnce();
  });
});

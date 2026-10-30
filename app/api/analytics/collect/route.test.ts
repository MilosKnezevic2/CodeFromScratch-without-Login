import { beforeEach, describe, expect, it, vi } from "vitest";

const { increment, slugs, cookieStore, verifySession, limit } = vi.hoisted(() => ({
  increment: vi.fn(),
  slugs: vi.fn(),
  cookieStore: { has: vi.fn(), get: vi.fn() },
  verifySession: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("@/lib/admin-session", () => ({ verifyAdminSession: verifySession }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: limit }));
vi.mock("@/lib/analytics/store", () => ({ incrementCounters: increment, publishedSlugs: slugs }));

import { POST } from "./route";

const BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";
const view = { type: "view", path: "/", entry: true, referrer: "www.google.com" };

function request(body: unknown, headers: Record<string, string> = {}, origin = "https://codefromscratch.org") {
  return new Request(`${origin}/api/analytics/collect`, {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      origin: "https://codefromscratch.org",
      "user-agent": BROWSER,
      "x-vercel-ip-country": "AT",
      "x-forwarded-for": "203.0.113.9",
      ...headers,
    },
  });
}

describe("POST /api/analytics/collect", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://codefromscratch.org");
    vi.spyOn(console, "error").mockImplementation(() => {});
    increment.mockReset();
    increment.mockResolvedValue(undefined);
    slugs.mockReset();
    slugs.mockResolvedValue(new Set(["real-post"]));
    limit.mockReset();
    limit.mockReturnValue({ success: true, remaining: 10 });
    verifySession.mockReset();
    verifySession.mockResolvedValue(false);
    cookieStore.has.mockReset();
    cookieStore.has.mockReturnValue(false);
    cookieStore.get.mockReset();
  });

  it("counts a real visit", async () => {
    const res = await POST(request(view));
    expect(res.status).toBe(204);
    expect(increment).toHaveBeenCalledWith([
      { metric: "view", key: "/", value: 1 },
      { metric: "entry", key: "/", value: 1 },
      { metric: "source", key: "google.com", value: 1 },
      { metric: "device", key: "desktop", value: 1 },
      { metric: "country", key: "AT", value: 1 },
    ]);
  });

  it("counts a batch with one write, folding duplicates", async () => {
    const res = await POST(
      request({
        events: [
          { type: "milestone", path: "/blog/real-post", name: "read50" },
          { type: "milestone", path: "/blog/real-post", name: "read90" },
          { type: "time", path: "/blog/real-post", seconds: 20 },
          { type: "time", path: "/blog/real-post", seconds: 15 },
          { type: "broken" },
        ],
      }),
    );
    expect(res.status).toBe(204);
    expect(increment).toHaveBeenCalledTimes(1);
    expect(increment).toHaveBeenCalledWith([
      { metric: "read50", key: "/blog/real-post", value: 1 },
      { metric: "read90", key: "/blog/real-post", value: 1 },
      { metric: "seconds", key: "/blog/real-post", value: 35 },
    ]);
  });

  it("stores nothing that identifies the visitor", async () => {
    await POST(request(view));
    const stored = JSON.stringify(increment.mock.calls[0][0]);
    expect(stored).not.toContain("203.0.113.9");
    expect(stored).not.toContain("Chrome");
  });

  it.each([
    ["a bot", { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" }],
    ["no user agent", { "user-agent": "" }],
    ["a missing country is still fine but no origin is not", { origin: "" }],
  ])("ignores %s", async (_name, headers) => {
    const res = await POST(request(view, headers));
    expect(res.status).toBe(204);
    expect(increment).not.toHaveBeenCalled();
  });

  it("counts readers on the www address", async () => {
    await POST(request(view, { origin: "https://www.codefromscratch.org" }, "https://www.codefromscratch.org"));
    expect(increment).toHaveBeenCalledTimes(1);
  });

  it("ignores preview deployments", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://other-host.example");
    await POST(request(view));
    expect(increment).not.toHaveBeenCalled();
  });

  it("ignores the logged-in administrator", async () => {
    cookieStore.get.mockReturnValue({ value: "token" });
    verifySession.mockResolvedValue(true);
    await POST(request(view));
    expect(increment).not.toHaveBeenCalled();
  });

  it("ignores draft previews", async () => {
    cookieStore.has.mockReturnValue(true);
    await POST(request(view));
    expect(increment).not.toHaveBeenCalled();
  });

  it("ignores requests over the rate limit", async () => {
    limit.mockReturnValue({ success: false, remaining: 0 });
    await POST(request(view));
    expect(increment).not.toHaveBeenCalled();
  });

  it("ignores broken and oversized bodies", async () => {
    await POST(request("{not json"));
    await POST(request(""));
    await POST(request(JSON.stringify({ ...view, referrer: "x".repeat(5000) })));
    await POST(request({ type: "unknown", path: "/" }));
    expect(increment).not.toHaveBeenCalled();
  });

  it("answers normally when the database is down", async () => {
    increment.mockRejectedValue(new Error("database asleep"));
    const res = await POST(request(view));
    expect(res.status).toBe(204);
    expect(console.error).toHaveBeenCalled();
  });
});

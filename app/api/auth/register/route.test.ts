import { describe, it, expect, afterEach, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { POST } from "./route";

function post(body: Record<string, unknown>): Request {
  return new Request("https://codefromscratch.org/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
  });

  it("is closed unless REGISTRATION_OPEN is true, and touches no data", async () => {
    const res = await POST(post({ name: "Alex", email: "alex@example.com", password: "a-long-password-1" }));
    expect(res.status).toBe(403);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("stays closed for any other value of the flag", async () => {
    vi.stubEnv("REGISTRATION_OPEN", "1");
    const res = await POST(post({ name: "Alex", email: "alex@example.com", password: "a-long-password-1" }));
    expect(res.status).toBe(403);
  });

  it("opens only when the flag is exactly true", async () => {
    vi.stubEnv("REGISTRATION_OPEN", "true");
    const res = await POST(post({}));
    // Past the gate, an empty body is a validation error, not a 403.
    expect(res.status).toBe(400);
  });
});

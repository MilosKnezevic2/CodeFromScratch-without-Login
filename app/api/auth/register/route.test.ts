import { describe, it, expect, afterEach, vi } from "vitest";

const { prismaMock, registrationOpen } = vi.hoisted(() => ({
  prismaMock: { user: { findUnique: vi.fn(), create: vi.fn() } },
  registrationOpen: { value: false },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/settings/store", () => ({
  getSettings: async () => ({ features: { registrationOpen: registrationOpen.value } }),
}));

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
    registrationOpen.value = false;
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
  });

  it("is closed unless the portal switch is on, and touches no data", async () => {
    const res = await POST(post({ name: "Alex", email: "alex@example.com", password: "a-long-password-1" }));
    expect(res.status).toBe(403);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("ignores the old environment flag", async () => {
    vi.stubEnv("REGISTRATION_OPEN", "true");
    const res = await POST(post({ name: "Alex", email: "alex@example.com", password: "a-long-password-1" }));
    vi.unstubAllEnvs();
    expect(res.status).toBe(403);
  });

  it("opens when the portal switch is on", async () => {
    registrationOpen.value = true;
    const res = await POST(post({}));
    // Past the gate, an empty body is a validation error, not a 403.
    expect(res.status).toBe(400);
  });
});

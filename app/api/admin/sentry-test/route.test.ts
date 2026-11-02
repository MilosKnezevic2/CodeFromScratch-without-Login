import { describe, expect, it, vi } from "vitest";

const { isAdmin } = vi.hoisted(() => ({ isAdmin: vi.fn() }));
vi.mock("@/lib/admin-guard", () => ({ isAdminRequest: isAdmin }));

import { GET } from "./route";

describe("GET /api/admin/sentry-test", () => {
  it("refuses anyone but the admin", async () => {
    isAdmin.mockResolvedValue(false);
    expect((await GET()).status).toBe(403);
  });

  it("throws for the admin, so the error reaches Sentry", async () => {
    isAdmin.mockResolvedValue(true);
    await expect(GET()).rejects.toThrow(/Sentry test/);
  });
});

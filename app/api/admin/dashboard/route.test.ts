import { beforeEach, describe, expect, it, vi } from "vitest";

const { isAdmin, findMany } = vi.hoisted(() => ({ isAdmin: vi.fn(), findMany: vi.fn() }));

vi.mock("@/lib/admin-guard", () => ({ isAdminRequest: isAdmin }));
vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get: () => ({
        count: async () => 0,
        findMany: findMany.mockResolvedValue([]),
        groupBy: async () => [],
      }),
    },
  ),
}));

import { GET } from "./route";

describe("GET /api/admin/dashboard", () => {
  beforeEach(() => {
    isAdmin.mockReset();
    findMany.mockClear();
  });

  it("refuses without an admin session and reads nothing", async () => {
    isAdmin.mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(403);
    expect(findMany).not.toHaveBeenCalled();
    expect(JSON.stringify(await res.json())).not.toContain("recentUsers");
  });

  it("answers an admin", async () => {
    isAdmin.mockResolvedValue(true);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveProperty("recentUsers");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { isAdmin, findMany } = vi.hoisted(() => ({ isAdmin: vi.fn(), findMany: vi.fn() }));
vi.mock("@/lib/admin-guard", () => ({ isAdminRequest: isAdmin }));
vi.mock("@/lib/prisma", () => ({ prisma: { courseWaitlist: { findMany } } }));

import { GET } from "./route";

describe("GET /api/admin/waitlist/export", () => {
  beforeEach(() => {
    isAdmin.mockReset();
    findMany.mockReset();
  });

  it("refuses anyone but the admin", async () => {
    isAdmin.mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(403);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("exports every sign-up, with formula cells disarmed", async () => {
    isAdmin.mockResolvedValue(true);
    findMany.mockResolvedValue([
      { email: "emily@example.com", confirmed: true, level: "beginner", note: "=HYPERLINK(1)", createdAt: new Date("2026-11-01T10:00:00Z") },
      { email: "james@example.com", confirmed: false, level: "advanced", note: null, createdAt: new Date("2026-11-02T10:00:00Z") },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv.split("\r\n")).toEqual([
      `"email","list","level","status","note","signed_up"`,
      `"emily@example.com","course","beginner","confirmed","'=HYPERLINK(1)","2026-11-01T10:00:00.000Z"`,
      `"james@example.com","course","advanced","pending","","2026-11-02T10:00:00.000Z"`,
    ]);
  });
});

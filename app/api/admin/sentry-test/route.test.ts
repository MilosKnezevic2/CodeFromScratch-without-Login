import { beforeEach, describe, expect, it, vi } from "vitest";

const { isAdmin, getClient, captureException, flush } = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  getClient: vi.fn(),
  captureException: vi.fn(),
  flush: vi.fn(),
}));
vi.mock("@/lib/admin-guard", () => ({ isAdminRequest: isAdmin }));
vi.mock("@sentry/nextjs", () => ({ getClient, captureException, flush }));

import { GET } from "./route";

const req = (q = "") => new Request(`https://codefromscratch.org/api/admin/sentry-test${q}`);

describe("GET /api/admin/sentry-test", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getClient.mockReturnValue({});
    captureException.mockReturnValue("evt123");
    flush.mockResolvedValue(true);
  });

  it("refuses anyone but the admin", async () => {
    isAdmin.mockResolvedValue(false);
    expect((await GET(req())).status).toBe(403);
    expect(captureException).not.toHaveBeenCalled();
  });

  it("reports, waits for delivery and answers with the event id", async () => {
    isAdmin.mockResolvedValue(true);
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: true, eventId: "evt123" });
    expect(flush).toHaveBeenCalled();
  });

  it("says so when tracking is not active", async () => {
    isAdmin.mockResolvedValue(true);
    getClient.mockReturnValue(undefined);
    expect((await GET(req())).status).toBe(503);
  });

  it("throws on request, like a real bug", async () => {
    isAdmin.mockResolvedValue(true);
    await expect(GET(req("?throw=1"))).rejects.toThrow(/thrown/);
  });
});

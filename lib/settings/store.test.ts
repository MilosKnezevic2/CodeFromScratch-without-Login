import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const cached: { fn: (() => Promise<unknown>) | null } = { fn: null };

vi.mock("@/lib/prisma", () => ({ prisma: { siteSetting: { findMany: (...args: unknown[]) => findMany(...args) } } }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  // Stands in for the Next data cache: runs the function and remembers it.
  unstable_cache: (fn: () => Promise<unknown>) => {
    cached.fn = fn;
    return fn;
  },
}));

const { getSettings } = await import("./store");

describe("getSettings", () => {
  beforeEach(() => {
    findMany.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("never hands a failed read to the cache, so the defaults are not stored", async () => {
    findMany.mockRejectedValue(new Error("Connection terminated due to connection timeout"));
    await expect(cached.fn?.()).rejects.toThrow("connection timeout");
  });

  it("falls back to the last good values after a timeout, not to the defaults", async () => {
    findMany.mockResolvedValueOnce([{ key: "features", value: { registrationOpen: true } }]);
    expect((await getSettings()).features.registrationOpen).toBe(true);

    findMany.mockRejectedValue(new Error("Connection terminated due to connection timeout"));
    expect((await getSettings()).features.registrationOpen).toBe(true);
  });
});

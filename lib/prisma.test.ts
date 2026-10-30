import { describe, expect, it, vi } from "vitest";

const { poolOptions } = vi.hoisted(() => ({ poolOptions: vi.fn() }));

vi.mock("pg", () => ({
  Pool: class {
    constructor(options: unknown) {
      poolOptions(options);
    }
  },
}));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: class {} }));
vi.mock("./generated/prisma/client", () => ({ PrismaClient: class {} }));

describe("database pool", () => {
  it("keeps each serverless instance small and uses the transaction pooler", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@aws-0-eu.pooler.supabase.com:5432/postgres");
    await import("./prisma");
    const options = poolOptions.mock.calls[0][0];
    expect(options.connectionString).toContain(":6543/");
    expect(options.max).toBeLessThanOrEqual(2);
    expect(options.idleTimeoutMillis).toBeLessThanOrEqual(5_000);
    expect(options.connectionTimeoutMillis).toBeLessThanOrEqual(3_000);
  });
});

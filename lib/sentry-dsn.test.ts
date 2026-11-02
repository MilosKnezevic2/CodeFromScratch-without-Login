import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldReport } from "./sentry-dsn";

describe("shouldReport", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reports from the live site only", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    expect(shouldReport({ hostname: "codefromscratch.org" })).toBe(true);
    expect(shouldReport({ hostname: "localhost" })).toBe(false);
    expect(shouldReport({ hostname: "codefromscratch-git-dev.vercel.app" })).toBe(false);
    expect(shouldReport({ vercelEnv: "production" })).toBe(true);
    expect(shouldReport({ vercelEnv: "preview" })).toBe(false);
    expect(shouldReport({})).toBe(false);
  });

  it("always reports when a DSN is set explicitly", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://key@o1.ingest.de.sentry.io/1");
    expect(shouldReport({ hostname: "localhost" })).toBe(true);
  });
});

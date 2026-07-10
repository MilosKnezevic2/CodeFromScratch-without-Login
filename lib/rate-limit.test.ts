import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { rateLimit, resetRateLimitStore } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("k", 3, 60_000).success).toBe(true);
    }
  });

  it("blocks the request after the limit is reached", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 60_000);
    const result = rateLimit("k", 3, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("reports remaining attempts as they are consumed", () => {
    expect(rateLimit("k", 3, 60_000).remaining).toBe(2);
    expect(rateLimit("k", 3, 60_000).remaining).toBe(1);
    expect(rateLimit("k", 3, 60_000).remaining).toBe(0);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60_000);
    expect(rateLimit("a", 3, 60_000).success).toBe(false);
    expect(rateLimit("b", 3, 60_000).success).toBe(true);
  });

  it("resets the counter once the window has passed", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 60_000);
    expect(rateLimit("k", 3, 60_000).success).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(rateLimit("k", 3, 60_000).success).toBe(true);
  });

  it("does not reset early", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 60_000);
    vi.advanceTimersByTime(59_000);
    expect(rateLimit("k", 3, 60_000).success).toBe(false);
  });
});

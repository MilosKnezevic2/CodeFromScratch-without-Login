import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { cycleTaskFor } from "@/lib/brand-cycle";
import { GET } from "./route";

const fetchMock = vi.fn();

function call(auth?: string): Promise<Response> {
  return GET(
    new NextRequest("https://codefromscratch.org/api/cron/brand-cycle", {
      headers: auth ? { authorization: auth } : {},
    }),
  );
}

describe("cycleTaskFor", () => {
  it.each([
    ["2026-11-15T13:30:00Z", "rewrite"], // Sunday
    ["2026-11-16T13:30:00Z", "brand-cycle"], // Monday
    ["2026-11-17T13:30:00Z", null], // Tuesday
    ["2026-11-18T13:30:00Z", "brand-cycle"], // Wednesday
    ["2026-11-19T13:30:00Z", null], // Thursday
    ["2026-11-20T13:30:00Z", "brand-cycle"], // Friday
    ["2026-11-21T13:30:00Z", null], // Saturday
  ])("%s -> %s", (iso, task) => {
    expect(cycleTaskFor(new Date(iso))).toBe(task);
  });
});

describe("GET /api/cron/brand-cycle", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.stubEnv("GH_CYCLE_REPO", "owner/private-repo");
    vi.stubEnv("GH_CYCLE_TOKEN", "github_pat_test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-13T13:20:00Z")); // a Friday
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("refuses without the cron secret, and when no secret is configured", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer ")).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks GitHub to start the day's task in auto mode", async () => {
    const res = await call("Bearer s3cret");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ dispatched: "brand-cycle" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/owner/private-repo/actions/workflows/brand-cycle.yml/dispatches");
    expect(init.headers.authorization).toBe("Bearer github_pat_test");
    expect(JSON.parse(init.body)).toEqual({ ref: "main", inputs: { task: "brand-cycle", auto: "true" } });
  });

  it("does nothing on a day without a cycle", async () => {
    vi.setSystemTime(new Date("2026-11-17T13:20:00Z")); // a Tuesday
    expect(await (await call("Bearer s3cret")).json()).toEqual({ skipped: "not a cycle day" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a missing token as a server error", async () => {
    vi.stubEnv("GH_CYCLE_TOKEN", "");
    expect((await call("Bearer s3cret")).status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 when GitHub refuses or cannot be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(new Response("Bad credentials", { status: 401 }));
    expect((await call("Bearer s3cret")).status).toBe(502);
    fetchMock.mockRejectedValueOnce(new Error("timeout"));
    expect((await call("Bearer s3cret")).status).toBe(502);
  });
});

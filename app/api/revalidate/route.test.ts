import { describe, it, expect, beforeEach, vi } from "vitest";

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

import { POST } from "./route";

function makeRequest(opts: {
  header?: string;
  query?: string;
  body?: unknown;
}): Request {
  const url = `https://codefromscratch.org/api/revalidate${
    opts.query ? `?secret=${opts.query}` : ""
  }`;
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(opts.header ? { "x-revalidate-secret": opts.header } : {}),
    },
    body: JSON.stringify(opts.body ?? { _type: "post", slug: { current: "hello" } }),
  });
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    revalidatePath.mockClear();
    process.env.SANITY_REVALIDATE_SECRET = "test-secret";
  });

  it("fails closed when no secret is configured", async () => {
    delete process.env.SANITY_REVALIDATE_SECRET;
    const res = await POST(makeRequest({ header: "anything" }));
    expect(res.status).toBe(503);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects requests without the secret", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret", async () => {
    const res = await POST(makeRequest({ header: "wrong" }));
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("accepts the secret via header and revalidates the post paths", async () => {
    const res = await POST(makeRequest({ header: "test-secret" }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/blog");
    expect(revalidatePath).toHaveBeenCalledWith("/blog/hello");
  });

  it("accepts the secret via query parameter", async () => {
    const res = await POST(makeRequest({ query: "test-secret" }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/blog");
  });

  it("returns 500 on a malformed body without leaking", async () => {
    const req = new Request("https://codefromscratch.org/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "test-secret" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

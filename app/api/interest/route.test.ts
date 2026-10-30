import { describe, it, expect } from "vitest";
import { POST } from "./route";

describe("POST /api/interest (retired)", () => {
  it("answers 410 and never writes anything", async () => {
    const res = POST();
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toContain("/newsletter");
  });
});

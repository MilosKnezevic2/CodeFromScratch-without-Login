import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

const prismaMock = vi.hoisted(() => ({
  courseWaitlist: {
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { POST as confirm } from "./route";
import { POST as unsubscribe } from "../unsubscribe/route";

const RAW = "b".repeat(64);
const HASHED = crypto.createHash("sha256").update(RAW).digest("hex");

function post(path: string, token?: string): Request {
  return new Request(`https://codefromscratch.org/api/waitlist/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(token === undefined ? {} : { token }),
  });
}

describe("waitlist confirm and unsubscribe", () => {
  beforeEach(() => {
    prismaMock.courseWaitlist.findFirst.mockReset();
    prismaMock.courseWaitlist.update.mockReset();
    prismaMock.courseWaitlist.delete.mockReset();
  });

  it("confirm: rejects a missing token without a lookup", async () => {
    const res = await confirm(post("confirm"));
    expect(res.status).toBe(400);
    expect(prismaMock.courseWaitlist.findFirst).not.toHaveBeenCalled();
  });

  it("confirm: looks the token up by hash and confirms", async () => {
    prismaMock.courseWaitlist.findFirst.mockResolvedValue({ id: "w1", confirmed: false, updatedAt: new Date() });
    const body = await (await confirm(post("confirm", RAW))).json();
    expect(prismaMock.courseWaitlist.findFirst).toHaveBeenCalledWith({ where: { confirmToken: HASHED } });
    expect(prismaMock.courseWaitlist.update).toHaveBeenCalledWith({ where: { id: "w1" }, data: { confirmed: true } });
    expect(body.status).toBe("confirmed");
  });

  it("confirm: is idempotent and honours the 7-day window", async () => {
    prismaMock.courseWaitlist.findFirst.mockResolvedValue({ id: "w1", confirmed: true, updatedAt: new Date() });
    expect((await (await confirm(post("confirm", RAW))).json()).status).toBe("already");

    prismaMock.courseWaitlist.findFirst.mockResolvedValue({
      id: "w1",
      confirmed: false,
      updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });
    expect((await (await confirm(post("confirm", RAW))).json()).status).toBe("expired");
    expect(prismaMock.courseWaitlist.update).not.toHaveBeenCalled();
  });

  it("confirm: an unknown token is invalid", async () => {
    prismaMock.courseWaitlist.findFirst.mockResolvedValue(null);
    expect((await (await confirm(post("confirm", RAW))).json()).status).toBe("invalid");
  });

  it("unsubscribe: deletes the whole row", async () => {
    prismaMock.courseWaitlist.findFirst.mockResolvedValue({ id: "w1" });
    const body = await (await unsubscribe(post("unsubscribe", "u".repeat(64)))).json();
    expect(prismaMock.courseWaitlist.delete).toHaveBeenCalledWith({ where: { id: "w1" } });
    expect(body.status).toBe("unsubscribed");
  });

  it("unsubscribe: an unknown token deletes nothing", async () => {
    prismaMock.courseWaitlist.findFirst.mockResolvedValue(null);
    expect((await (await unsubscribe(post("unsubscribe", "u".repeat(64)))).json()).status).toBe("invalid");
    expect(prismaMock.courseWaitlist.delete).not.toHaveBeenCalled();
  });
});

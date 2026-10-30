import { describe, it, expect, beforeEach, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  newsletterSubscriber: { deleteMany: vi.fn() },
}));
const batchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/resend", () => ({
  getResend: () => ({ batch: { send: batchMock }, emails: { send: vi.fn() } }),
  getEmailFrom: () => "CodeFromScratch <hello@codefromscratch.org>",
}));
vi.mock("@/lib/sanity/queries", () => ({ getPostBySlug: vi.fn() }));
vi.mock("@/lib/sanity/image", () => ({ urlFor: vi.fn() }));

import { PENDING_RETENTION_DAYS, SEND_BATCH_SIZE, purgeExpiredPending, sendLetterToRecipients } from "./service";

describe("purgeExpiredPending", () => {
  beforeEach(() => {
    prismaMock.newsletterSubscriber.deleteMany.mockReset();
  });

  it("only ever deletes unconfirmed rows older than the retention period", async () => {
    prismaMock.newsletterSubscriber.deleteMany.mockResolvedValue({ count: 3 });
    const now = new Date("2026-10-30T12:00:00Z");
    expect(await purgeExpiredPending(now)).toBe(3);

    const { where } = prismaMock.newsletterSubscriber.deleteMany.mock.calls[0]![0];
    expect(where.confirmed).toBe(false);
    const ageMs = now.getTime() - where.updatedAt.lt.getTime();
    expect(ageMs).toBe(PENDING_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  });
});

describe("sendLetterToRecipients", () => {
  beforeEach(() => {
    batchMock.mockReset();
  });

  it("splits a large list into batches the API accepts, with distinct idempotency keys", async () => {
    vi.useFakeTimers();
    batchMock.mockImplementation(async (payload: unknown[]) => ({
      data: { data: payload.map((_, i) => ({ id: String(i) })), errors: [] },
      error: null,
    }));
    const recipients = Array.from({ length: SEND_BATCH_SIZE + 5 }, (_, i) => ({
      email: `p${i}@example.com`,
      unsubscribeToken: `t${i}`,
    }));

    const promise = sendLetterToRecipients({ subject: "S", note: "N" }, recipients, "c1");
    await vi.runAllTimersAsync();
    const result = await promise;
    vi.useRealTimers();

    expect(result).toEqual({ sent: SEND_BATCH_SIZE + 5, failed: 0 });
    expect(batchMock).toHaveBeenCalledTimes(2);
    expect(batchMock.mock.calls[0]![0]).toHaveLength(SEND_BATCH_SIZE);
    expect(batchMock.mock.calls[1]![0]).toHaveLength(5);
    expect(batchMock.mock.calls[0]![1].idempotencyKey).not.toBe(batchMock.mock.calls[1]![1].idempotencyKey);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: { adminAuditLog: { create: vi.fn(), findFirst: vi.fn() } },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { createAdminSession } from "./admin-session";
import { isAdminSessionActive, REVOKE_ACTION, revokeAdminSessions } from "./admin-session-store";

beforeEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
  vi.stubEnv("NEXTAUTH_SECRET", "a-thirty-two-character-secret-value-for-tests");
});

async function tokenIssuedAt(at: string): Promise<string> {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(at));
  const token = await createAdminSession();
  vi.setSystemTime(new Date("2026-11-18T12:00:00Z"));
  return token;
}

describe("isAdminSessionActive", () => {
  it("accepts a genuine session when nothing was ever revoked", async () => {
    db.adminAuditLog.findFirst.mockResolvedValue(null);
    const token = await tokenIssuedAt("2026-11-18T11:00:00Z");
    await expect(isAdminSessionActive(token)).resolves.toBe(true);
    expect(db.adminAuditLog.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { action: REVOKE_ACTION } }));
  });

  it("rejects a session issued before the latest revocation (a copied cookie after logout)", async () => {
    db.adminAuditLog.findFirst.mockResolvedValue({ createdAt: new Date("2026-11-18T11:30:00Z") });
    const token = await tokenIssuedAt("2026-11-18T11:00:00Z");
    await expect(isAdminSessionActive(token)).resolves.toBe(false);
  });

  it("accepts a session issued after the latest revocation (signing in again)", async () => {
    db.adminAuditLog.findFirst.mockResolvedValue({ createdAt: new Date("2026-11-18T11:30:00Z") });
    const token = await tokenIssuedAt("2026-11-18T11:45:00Z");
    await expect(isAdminSessionActive(token)).resolves.toBe(true);
  });

  it("fails closed when the database cannot answer", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.adminAuditLog.findFirst.mockRejectedValue(new Error("db asleep"));
    const token = await tokenIssuedAt("2026-11-18T11:45:00Z");
    await expect(isAdminSessionActive(token)).resolves.toBe(false);
  });

  it("never asks the database about a forged or missing cookie", async () => {
    await expect(isAdminSessionActive("forged.token")).resolves.toBe(false);
    await expect(isAdminSessionActive(undefined)).resolves.toBe(false);
    expect(db.adminAuditLog.findFirst).not.toHaveBeenCalled();
  });
});

describe("revokeAdminSessions", () => {
  it("records the revocation with the app clock, so the next sign-in is never judged by a skewed database clock", async () => {
    db.adminAuditLog.create.mockResolvedValue({});
    const now = new Date("2026-11-18T12:00:00Z");
    await expect(revokeAdminSessions("logout", "1.2.3.4", now)).resolves.toBe(now);
    expect(db.adminAuditLog.create).toHaveBeenCalledWith({
      data: { action: REVOKE_ACTION, detail: { reason: "logout" }, ip: "1.2.3.4", createdAt: now },
    });
  });

  it("throws when the revocation cannot be recorded, instead of pretending", async () => {
    db.adminAuditLog.create.mockRejectedValue(new Error("db asleep"));
    await expect(revokeAdminSessions("password-changed", null)).rejects.toThrow("db asleep");
  });
});

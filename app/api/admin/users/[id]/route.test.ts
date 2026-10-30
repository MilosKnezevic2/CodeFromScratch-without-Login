import { beforeEach, describe, expect, it, vi } from "vitest";

const { isAdmin, db } = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  db: {
    user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    subscription: { upsert: vi.fn() },
  },
}));

vi.mock("@/lib/admin-guard", () => ({ isAdminRequest: isAdmin }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { DELETE, GET, PATCH } from "./route";

const context = { params: Promise.resolve({ id: "user-1" }) };
const patch = (body: unknown) =>
  PATCH(new Request("https://x.test/api/admin/users/user-1", { method: "PATCH", body: JSON.stringify(body) }), context);
const get = () => GET(new Request("https://x.test/api/admin/users/user-1"), context);
const del = () => DELETE(new Request("https://x.test/api/admin/users/user-1", { method: "DELETE" }), context);

describe("/api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.user.findUnique.mockResolvedValue({ id: "user-1", email: "a@example.com" });
  });

  describe("without an admin session", () => {
    beforeEach(() => isAdmin.mockResolvedValue(false));

    it("refuses to read an account", async () => {
      expect((await get()).status).toBe(403);
      expect(db.user.findUnique).not.toHaveBeenCalled();
    });

    it("refuses to make anyone an admin", async () => {
      expect((await patch({ role: "ADMIN" })).status).toBe(403);
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it("refuses to change a plan", async () => {
      expect((await patch({ plan: "PRO" })).status).toBe(403);
      expect(db.subscription.upsert).not.toHaveBeenCalled();
    });

    it("refuses to delete an account", async () => {
      expect((await del()).status).toBe(403);
      expect(db.user.delete).not.toHaveBeenCalled();
    });
  });

  describe("with an admin session", () => {
    beforeEach(() => isAdmin.mockResolvedValue(true));

    it("reads an account without ever selecting credentials", async () => {
      expect((await get()).status).toBe(200);
      expect(db.user.findUnique.mock.calls[0][0].omit).toEqual({
        passwordHash: true,
        mfaSecret: true,
        mfaBackupCodes: true,
      });
    });

    it("leaves credentials out after an update too", async () => {
      await patch({ banned: true });
      expect(db.user.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { banned: true } });
      expect(db.user.findUnique.mock.calls[0][0].omit.passwordHash).toBe(true);
    });

    it("rejects values outside the allowed lists", async () => {
      expect((await patch({ role: "OWNER" })).status).toBe(400);
      expect((await patch({ banned: "yes" })).status).toBe(400);
      expect((await patch({ plan: "FREE_FOREVER" })).status).toBe(400);
      expect(db.user.update).not.toHaveBeenCalled();
      expect(db.subscription.upsert).not.toHaveBeenCalled();
    });

    it("answers 404 for an unknown account", async () => {
      db.user.findUnique.mockResolvedValue(null);
      expect((await get()).status).toBe(404);
    });

    it("deletes an account", async () => {
      expect((await del()).status).toBe(200);
      expect(db.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    });
  });
});

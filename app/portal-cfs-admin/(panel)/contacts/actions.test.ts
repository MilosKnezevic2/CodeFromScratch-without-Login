import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ contactSubmission: { updateMany: vi.fn(), deleteMany: vi.fn() } }));
const admin = vi.hoisted(() => vi.fn());
const audit = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/admin-guard", () => ({ isAdminRequest: admin }));
vi.mock("@/lib/audit", () => ({ recordAudit: audit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { changeMessageAction, markAllReadAction, markReadAction } from "./actions";

const ID = "cmh2q8v7x0000a1b2c3d4e5f6";

beforeEach(() => {
  db.contactSubmission.updateMany.mockReset().mockResolvedValue({ count: 1 });
  db.contactSubmission.deleteMany.mockReset().mockResolvedValue({ count: 1 });
  admin.mockReset().mockResolvedValue(true);
  audit.mockReset();
});

describe("contact inbox actions", () => {
  it("do nothing without an admin session", async () => {
    admin.mockResolvedValue(false);
    await markReadAction(ID);
    await changeMessageAction(ID, "delete");
    await markAllReadAction();
    expect(db.contactSubmission.updateMany).not.toHaveBeenCalled();
    expect(db.contactSubmission.deleteMany).not.toHaveBeenCalled();
  });

  it("refuse an id that is not a message id, before asking for the session", async () => {
    await changeMessageAction("x' OR 1=1", "archive");
    expect(admin).not.toHaveBeenCalled();
    expect(db.contactSubmission.updateMany).not.toHaveBeenCalled();
  });

  it("refuse an unknown change", async () => {
    await changeMessageAction(ID, "toString" as never);
    expect(db.contactSubmission.updateMany).not.toHaveBeenCalled();
  });

  it("mark a message read only when it was unread", async () => {
    await markReadAction(ID);
    expect(db.contactSubmission.updateMany).toHaveBeenCalledWith({ where: { id: ID, read: false }, data: { read: true } });
  });

  it("file a message as done, which also counts as read, and record it", async () => {
    await changeMessageAction(ID, "archive");
    expect(db.contactSubmission.updateMany).toHaveBeenCalledWith({ where: { id: ID }, data: { read: true, archivedAt: expect.any(Date) } });
    expect(audit).toHaveBeenCalledWith("contact.archive", { ref: ID });
  });

  it("delete a message for good and record it", async () => {
    await changeMessageAction(ID, "delete");
    expect(db.contactSubmission.deleteMany).toHaveBeenCalledWith({ where: { id: ID } });
    expect(audit).toHaveBeenCalledWith("contact.delete", { ref: ID });
  });

  it("clear the New labels only in the inbox", async () => {
    await markAllReadAction();
    expect(db.contactSubmission.updateMany).toHaveBeenCalledWith({ where: { read: false, archivedAt: null }, data: { read: true } });
  });
});

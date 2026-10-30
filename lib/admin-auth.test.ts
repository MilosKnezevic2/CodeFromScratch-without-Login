import bcrypt from "bcryptjs";
import { generateSecret, generateSync } from "otplib";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, audit } = vi.hoisted(() => ({
  db: { adminAccount: { findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn() } },
  audit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/audit", () => ({ recordAudit: audit }));

import { encryptSecret } from "@/lib/services/mfa";
import { changePassword, changeUsername, checkCredentials, confirmMfaEnrolment, disableMfa, getAdminState, login, startMfaEnrolment } from "./admin-auth";

const SECRET_ENV = "a-thirty-two-character-secret-value-for-tests";
const PASSWORD = "correct horse battery staple";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "admin",
    username: "milos",
    passwordHash: bcrypt.hashSync(PASSWORD, 4),
    passwordChangedAt: new Date("2026-10-01"),
    mfaSecret: null,
    mfaPendingSecret: null,
    mfaBackupCodes: [] as string[],
    mfaEnabledAt: null,
    failedLogins: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date("2026-10-01"),
    updatedAt: new Date("2026-10-01"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXTAUTH_SECRET", SECRET_ENV);
  vi.stubEnv("CFS_ADMIN_USERNAME", "");
  vi.stubEnv("CFS_ADMIN_PASSWORD", "");
  vi.stubEnv("CFS_ADMIN_MFA_SECRET", "");
  db.adminAccount.update.mockResolvedValue(undefined);
  db.adminAccount.upsert.mockResolvedValue(undefined);
});

describe("before the operator sets a password", () => {
  beforeEach(() => {
    db.adminAccount.findUnique.mockResolvedValue(null);
    vi.stubEnv("CFS_ADMIN_USERNAME", "start-user");
    vi.stubEnv("CFS_ADMIN_PASSWORD", "start-password-123");
  });

  it("accepts the environment credentials", async () => {
    expect(await checkCredentials("start-user", "start-password-123")).toEqual({ ok: true, mfaRequired: false });
    expect(await checkCredentials("start-user", "wrong")).toEqual({ ok: false, reason: "invalid" });
    expect(await checkCredentials("other", "start-password-123")).toEqual({ ok: false, reason: "invalid" });
  });

  it("reports unconfigured when nothing is set anywhere", async () => {
    vi.stubEnv("CFS_ADMIN_PASSWORD", "");
    expect(await checkCredentials("start-user", "x")).toEqual({ ok: false, reason: "unconfigured" });
  });

  it("moves the account into the database on the first password change", async () => {
    const result = await changePassword({ current: "start-password-123", next: "a brand new long password", ip: "1.2.3.4" });
    expect(result).toEqual({ ok: true });
    const call = db.adminAccount.upsert.mock.calls[0][0];
    expect(call.create.username).toBe("start-user");
    expect(bcrypt.compareSync("a brand new long password", call.create.passwordHash)).toBe(true);
    expect(audit).toHaveBeenCalledWith("password.changed", { movedToDatabase: true }, "1.2.3.4");
  });

  it("refuses a change with the wrong current password or a weak new one", async () => {
    expect(await changePassword({ current: "nope", next: "a brand new long password", ip: null })).toMatchObject({ ok: false, error: /current password/ });
    expect(await changePassword({ current: "start-password-123", next: "short", ip: null })).toMatchObject({ ok: false, error: /12 characters/ });
    expect(await changePassword({ current: "start-password-123", next: "aaaaaaaaaaaaaaaa", ip: null })).toMatchObject({ ok: false, error: /repeated/ });
    expect(db.adminAccount.upsert).not.toHaveBeenCalled();
  });

  it("will not start two-step login until the password lives in the database", async () => {
    expect(await startMfaEnrolment()).toMatchObject({ error: /password first/ });
    expect(await changeUsername({ password: "start-password-123", username: "new", ip: null })).toMatchObject({ ok: false });
  });
});

describe("with a database account", () => {
  it("ignores the environment credentials once a row exists", async () => {
    db.adminAccount.findUnique.mockResolvedValue(row());
    vi.stubEnv("CFS_ADMIN_USERNAME", "start-user");
    vi.stubEnv("CFS_ADMIN_PASSWORD", "start-password-123");
    expect(await checkCredentials("start-user", "start-password-123")).toEqual({ ok: false, reason: "invalid" });
    expect(await checkCredentials("milos", PASSWORD)).toEqual({ ok: true, mfaRequired: false });
  });

  it("locks the account after five wrong passwords", async () => {
    db.adminAccount.findUnique.mockResolvedValue(row({ failedLogins: 4 }));
    const now = new Date("2026-10-30T10:00:00Z");
    expect(await checkCredentials("milos", "wrong", now)).toEqual({ ok: false, reason: "invalid" });
    const data = db.adminAccount.update.mock.calls[0][0].data;
    expect(data.failedLogins).toBe(0);
    expect(data.lockedUntil).toEqual(new Date("2026-10-30T10:15:00Z"));
  });

  it("refuses even the right password while locked", async () => {
    db.adminAccount.findUnique.mockResolvedValue(row({ lockedUntil: new Date("2026-10-30T10:15:00Z") }));
    expect(await checkCredentials("milos", PASSWORD, new Date("2026-10-30T10:05:00Z"))).toMatchObject({ ok: false, reason: "locked" });
    expect(await checkCredentials("milos", PASSWORD, new Date("2026-10-30T10:16:00Z"))).toEqual({ ok: true, mfaRequired: false });
  });

  it("fails closed when the database cannot be read", async () => {
    db.adminAccount.findUnique.mockRejectedValue(new Error("asleep"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("CFS_ADMIN_USERNAME", "start-user");
    vi.stubEnv("CFS_ADMIN_PASSWORD", "start-password-123");
    expect(await checkCredentials("start-user", "start-password-123")).toEqual({ ok: false, reason: "unavailable" });
  });

  it("requires a code when two-step login is on, and accepts the app's code", async () => {
    const secret = generateSecret();
    db.adminAccount.findUnique.mockResolvedValue(row({ mfaSecret: encryptSecret(secret) }));
    expect(await checkCredentials("milos", PASSWORD)).toEqual({ ok: true, mfaRequired: true });
    expect(await login({ username: "milos", password: PASSWORD, ip: null })).toEqual({ ok: false, reason: "code-required" });
    expect(await login({ username: "milos", password: PASSWORD, code: "000000", ip: null })).toEqual({ ok: false, reason: "code-invalid" });
    expect(await login({ username: "milos", password: PASSWORD, code: generateSync({ secret }), ip: "9.9.9.9" })).toEqual({ ok: true });
    expect(audit).toHaveBeenLastCalledWith("login.success", { mfa: true }, "9.9.9.9");
  });

  it("accepts a backup code once and removes it", async () => {
    const hashed = bcrypt.hashSync("ABCDEF1234", 4);
    db.adminAccount.findUnique.mockResolvedValue(row({ mfaSecret: encryptSecret(generateSecret()), mfaBackupCodes: [hashed, "other"] }));
    expect(await login({ username: "milos", password: PASSWORD, code: "abcdef1234", ip: null })).toEqual({ ok: true });
    expect(db.adminAccount.update).toHaveBeenCalledWith({ where: { id: "admin" }, data: { mfaBackupCodes: ["other"] } });
  });

  it("enrols two-step login only with a code that matches the pending secret", async () => {
    const secret = generateSecret();
    db.adminAccount.findUnique.mockResolvedValue(row({ mfaPendingSecret: encryptSecret(secret) }));
    expect(await confirmMfaEnrolment("123456", null)).toMatchObject({ error: /did not match/ });
    const result = await confirmMfaEnrolment(generateSync({ secret }), null);
    expect("backupCodes" in result && result.backupCodes).toHaveLength(8);
    const data = db.adminAccount.update.mock.calls.at(-1)![0].data;
    expect(data.mfaSecret).toBe(encryptSecret(secret).length > 0 ? data.mfaSecret : "");
    expect(data.mfaPendingSecret).toBeNull();
    expect(data.mfaBackupCodes).toHaveLength(8);
  });

  it("starts enrolment with a scannable code and a typed key", async () => {
    db.adminAccount.findUnique.mockResolvedValue(row());
    const result = await startMfaEnrolment();
    expect("otpauthUri" in result && result.otpauthUri).toMatch(/^otpauth:\/\/totp\/.*milos/);
    expect("qrCodeDataUrl" in result && result.qrCodeDataUrl).toMatch(/^data:image\/png/);
    expect(db.adminAccount.update.mock.calls[0][0].data.mfaPendingSecret).toBeTruthy();
  });

  it("switches two-step login off only with a valid code", async () => {
    const secret = generateSecret();
    db.adminAccount.findUnique.mockResolvedValue(row({ mfaSecret: encryptSecret(secret) }));
    expect(await disableMfa("000000", null)).toMatchObject({ ok: false });
    expect(await disableMfa(generateSync({ secret }), "1.1.1.1")).toEqual({ ok: true });
    expect(db.adminAccount.update.mock.calls.at(-1)![0].data.mfaSecret).toBeNull();
    expect(audit).toHaveBeenCalledWith("mfa.disabled", {}, "1.1.1.1");
  });

  it("changes the username after checking the password", async () => {
    db.adminAccount.findUnique.mockResolvedValue(row());
    expect(await changeUsername({ password: "wrong", username: "new.name", ip: null })).toMatchObject({ ok: false });
    expect(await changeUsername({ password: PASSWORD, username: "bad name!", ip: null })).toMatchObject({ ok: false });
    expect(await changeUsername({ password: PASSWORD, username: "new.name", ip: null })).toEqual({ ok: true });
  });

  it("describes the account for the settings page without secrets", async () => {
    db.adminAccount.findUnique.mockResolvedValue(row({ mfaSecret: encryptSecret(generateSecret()), mfaBackupCodes: ["a", "b"] }));
    const state = await getAdminState();
    expect(state).toMatchObject({ source: "database", username: "milos", mfaEnabled: true, backupCodesLeft: 2 });
    expect(JSON.stringify(state)).not.toContain("passwordHash");
  });
});

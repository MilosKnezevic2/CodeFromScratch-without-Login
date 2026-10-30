import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verifySync } from "otplib";
import { toDataURL } from "qrcode";
import { prisma } from "@/lib/prisma";
import { isAdminMfaConfigured, verifyAdminTotpCode } from "@/lib/admin-mfa";
import { recordAudit } from "@/lib/audit";
import { decryptSecret, encryptSecret, safeEqual } from "@/lib/services/mfa";

/**
 * The administrator's credentials. The site starts with the username and
 * password from the environment; the moment the operator sets a password of
 * their own in the portal, a database row takes over and the environment
 * values stop working. Rotation then never needs Vercel.
 *
 * Recovery when the password is lost: delete the AdminAccount row in the
 * database, and the environment credentials work again.
 */

const ACCOUNT_ID = "admin";
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const BCRYPT_COST = 12;
const BACKUP_CODE_COUNT = 8;
const USERNAME = /^[A-Za-z0-9][A-Za-z0-9._-]{2,39}$/;
const TOTP = /^\d{6}$/;
const BACKUP = /^[A-F0-9]{10}$/;

type AccountRow = NonNullable<Awaited<ReturnType<typeof prisma.adminAccount.findUnique>>>;

type Stored =
  | { source: "database"; row: AccountRow }
  | { source: "environment"; username: string; password: string }
  | { source: "none" }
  | { source: "unavailable" };

async function loadStored(): Promise<Stored> {
  let row: AccountRow | null;
  try {
    row = await prisma.adminAccount.findUnique({ where: { id: ACCOUNT_ID } });
  } catch (error) {
    // Falling back to the environment here would let an old password work
    // whenever the database blinks, so this fails closed instead.
    console.error("Admin account could not be read:", error);
    return { source: "unavailable" };
  }
  if (row) return { source: "database", row };
  const username = process.env.CFS_ADMIN_USERNAME;
  const password = process.env.CFS_ADMIN_PASSWORD;
  if (username && password) return { source: "environment", username, password };
  return { source: "none" };
}

export type FailureReason = "invalid" | "locked" | "unconfigured" | "unavailable";

export type CredentialCheck = { ok: true; mfaRequired: boolean } | { ok: false; reason: FailureReason; retryAt?: Date };

function isLocked(row: AccountRow, now: Date): boolean {
  return row.lockedUntil !== null && row.lockedUntil > now;
}

async function noteFailure(row: AccountRow, now: Date): Promise<void> {
  const failedLogins = row.failedLogins + 1;
  const lockedUntil = failedLogins >= MAX_FAILED_LOGINS ? new Date(now.getTime() + LOCK_MINUTES * 60_000) : null;
  await prisma.adminAccount.update({
    where: { id: ACCOUNT_ID },
    data: { failedLogins: lockedUntil ? 0 : failedLogins, lockedUntil },
  });
}

async function passwordMatches(stored: Stored, username: string, password: string): Promise<boolean> {
  if (stored.source === "database") {
    return safeEqual(username, stored.row.username) && (await bcrypt.compare(password, stored.row.passwordHash));
  }
  if (stored.source === "environment") {
    return safeEqual(username, stored.username) && safeEqual(password, stored.password);
  }
  return false;
}

/**
 * Checks a username and password. A wrong pair counts towards the lockout
 * of the database account, so the login page can probe before asking for a
 * code without opening a side door.
 */
export async function checkCredentials(username: string, password: string, now = new Date()): Promise<CredentialCheck> {
  const stored = await loadStored();
  if (stored.source === "none") return { ok: false, reason: "unconfigured" };
  if (stored.source === "unavailable") return { ok: false, reason: "unavailable" };
  if (stored.source === "database" && isLocked(stored.row, now)) {
    return { ok: false, reason: "locked", retryAt: stored.row.lockedUntil ?? undefined };
  }
  if (!(await passwordMatches(stored, username, password))) {
    if (stored.source === "database") await noteFailure(stored.row, now);
    return { ok: false, reason: "invalid" };
  }
  const mfaRequired = stored.source === "database" ? stored.row.mfaSecret !== null : isAdminMfaConfigured();
  return { ok: true, mfaRequired };
}

/** A 6-digit code from the app, or one of the backup codes, which is used up on success. */
async function verifySecondFactor(stored: Stored, code: string): Promise<boolean> {
  const trimmed = code.trim().toUpperCase();
  if (stored.source === "environment") return verifyAdminTotpCode(trimmed);
  if (stored.source !== "database" || !stored.row.mfaSecret) return false;

  if (TOTP.test(trimmed)) {
    try {
      return verifySync({ token: trimmed, secret: decryptSecret(stored.row.mfaSecret), epochTolerance: [30, 30] }).valid === true;
    } catch {
      return false;
    }
  }
  if (!BACKUP.test(trimmed)) return false;
  for (const hashed of stored.row.mfaBackupCodes) {
    if (await bcrypt.compare(trimmed, hashed)) {
      await prisma.adminAccount.update({
        where: { id: ACCOUNT_ID },
        data: { mfaBackupCodes: stored.row.mfaBackupCodes.filter((h) => h !== hashed) },
      });
      return true;
    }
  }
  return false;
}

export type LoginResult = { ok: true } | { ok: false; reason: FailureReason | "code-required" | "code-invalid"; retryAt?: Date };

/** The whole login, with the audit line it leaves behind either way. */
export async function login(input: { username: string; password: string; code?: string; ip: string | null }): Promise<LoginResult> {
  const now = new Date();
  const check = await checkCredentials(input.username, input.password, now);
  if (!check.ok) {
    await recordAudit("login.failed", { reason: check.reason }, input.ip);
    return check;
  }
  if (check.mfaRequired) {
    if (!input.code) return { ok: false, reason: "code-required" };
    const stored = await loadStored();
    if (!(await verifySecondFactor(stored, input.code))) {
      if (stored.source === "database") await noteFailure(stored.row, now);
      await recordAudit("login.failed", { reason: "code-invalid" }, input.ip);
      return { ok: false, reason: "code-invalid" };
    }
  }
  try {
    await prisma.adminAccount.update({ where: { id: ACCOUNT_ID }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now } });
  } catch {
    // No database row yet (environment login): nothing to reset.
  }
  await recordAudit("login.success", { mfa: check.mfaRequired }, input.ip);
  return { ok: true };
}

export interface AdminState {
  source: "database" | "environment" | "none" | "unavailable";
  username: string | null;
  passwordChangedAt: Date | null;
  mfaEnabled: boolean;
  mfaSource: "database" | "environment" | null;
  mfaEnrolmentPending: boolean;
  backupCodesLeft: number;
  lastLoginAt: Date | null;
  lockedUntil: Date | null;
}

export async function getAdminState(): Promise<AdminState> {
  const stored = await loadStored();
  if (stored.source === "database") {
    const { row } = stored;
    return {
      source: "database",
      username: row.username,
      passwordChangedAt: row.passwordChangedAt,
      mfaEnabled: row.mfaSecret !== null,
      mfaSource: row.mfaSecret !== null ? "database" : null,
      mfaEnrolmentPending: row.mfaPendingSecret !== null,
      backupCodesLeft: row.mfaBackupCodes.length,
      lastLoginAt: row.lastLoginAt,
      lockedUntil: row.lockedUntil,
    };
  }
  return {
    source: stored.source,
    username: stored.source === "environment" ? stored.username : null,
    passwordChangedAt: null,
    mfaEnabled: stored.source === "environment" && isAdminMfaConfigured(),
    mfaSource: stored.source === "environment" && isAdminMfaConfigured() ? "environment" : null,
    mfaEnrolmentPending: false,
    backupCodesLeft: 0,
    lastLoginAt: null,
    lockedUntil: null,
  };
}

export type ChangeResult = { ok: true } | { ok: false; error: string };

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `Keep it under ${MAX_PASSWORD_LENGTH} characters.`;
  if (/^(.)\1+$/.test(password)) return "That is one repeated character.";
  return null;
}

/**
 * Sets a new password after proving the current one. The first change moves
 * the account from the environment into the database.
 */
export async function changePassword(input: { current: string; next: string; ip: string | null }): Promise<ChangeResult> {
  const stored = await loadStored();
  if (stored.source === "none" || stored.source === "unavailable") return { ok: false, error: "The account cannot be reached right now." };
  const username = stored.source === "database" ? stored.row.username : stored.username;
  if (!(await passwordMatches(stored, username, input.current))) {
    await recordAudit("password.change-failed", { reason: "current-wrong" }, input.ip);
    return { ok: false, error: "The current password is wrong." };
  }
  const problem = passwordProblem(input.next);
  if (problem) return { ok: false, error: problem };
  if (input.next === input.current) return { ok: false, error: "Choose a password you have not used here before." };

  const passwordHash = await bcrypt.hash(input.next, BCRYPT_COST);
  const now = new Date();
  await prisma.adminAccount.upsert({
    where: { id: ACCOUNT_ID },
    create: { id: ACCOUNT_ID, username, passwordHash, passwordChangedAt: now },
    update: { passwordHash, passwordChangedAt: now, failedLogins: 0, lockedUntil: null },
  });
  await recordAudit("password.changed", { movedToDatabase: stored.source === "environment" }, input.ip);
  return { ok: true };
}

export async function changeUsername(input: { password: string; username: string; ip: string | null }): Promise<ChangeResult> {
  const stored = await loadStored();
  if (stored.source !== "database") return { ok: false, error: "Set your own password first; the username then lives with it." };
  if (!USERNAME.test(input.username)) {
    return { ok: false, error: "3 to 40 characters: letters, numbers, dots, dashes or underscores, starting with a letter or number." };
  }
  if (!(await passwordMatches(stored, stored.row.username, input.password))) {
    return { ok: false, error: "The password is wrong." };
  }
  await prisma.adminAccount.update({ where: { id: ACCOUNT_ID }, data: { username: input.username } });
  await recordAudit("username.changed", {}, input.ip);
  return { ok: true };
}

export interface Enrolment {
  otpauthUri: string;
  qrCodeDataUrl: string;
  secret: string;
}

/** Starts two-step login: the secret waits, unused, until a code proves the app has it. */
export async function startMfaEnrolment(): Promise<Enrolment | { error: string }> {
  const stored = await loadStored();
  if (stored.source !== "database") return { error: "Set your own password first, then switch on two-step login." };
  const secret = generateSecret();
  const otpauthUri = generateURI({ issuer: "CodeFromScratch Admin", label: stored.row.username, secret });
  await prisma.adminAccount.update({ where: { id: ACCOUNT_ID }, data: { mfaPendingSecret: encryptSecret(secret) } });
  return { otpauthUri, qrCodeDataUrl: await toDataURL(otpauthUri), secret };
}

export async function confirmMfaEnrolment(code: string, ip: string | null): Promise<{ backupCodes: string[] } | { error: string }> {
  const stored = await loadStored();
  if (stored.source !== "database" || !stored.row.mfaPendingSecret) return { error: "Start the setup first." };
  const trimmed = code.trim();
  let valid = false;
  try {
    valid = TOTP.test(trimmed) && verifySync({ token: trimmed, secret: decryptSecret(stored.row.mfaPendingSecret), epochTolerance: [30, 30] }).valid === true;
  } catch {
    valid = false;
  }
  if (!valid) return { error: "That code did not match. Check the app and try the newest code." };

  const backupCodes: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const plain = randomBytes(5).toString("hex").toUpperCase();
    backupCodes.push(plain);
    hashed.push(await bcrypt.hash(plain, 10));
  }
  await prisma.adminAccount.update({
    where: { id: ACCOUNT_ID },
    data: { mfaSecret: stored.row.mfaPendingSecret, mfaPendingSecret: null, mfaEnabledAt: new Date(), mfaBackupCodes: hashed },
  });
  await recordAudit("mfa.enabled", {}, ip);
  return { backupCodes };
}

export async function disableMfa(code: string, ip: string | null): Promise<ChangeResult> {
  const stored = await loadStored();
  if (stored.source !== "database" || !stored.row.mfaSecret) return { ok: false, error: "Two-step login is not on." };
  if (!(await verifySecondFactor(stored, code))) return { ok: false, error: "That code did not match." };
  await prisma.adminAccount.update({
    where: { id: ACCOUNT_ID },
    data: { mfaSecret: null, mfaPendingSecret: null, mfaEnabledAt: null, mfaBackupCodes: [] },
  });
  await recordAudit("mfa.disabled", {}, ip);
  return { ok: true };
}

export async function cancelMfaEnrolment(): Promise<void> {
  try {
    await prisma.adminAccount.update({ where: { id: ACCOUNT_ID }, data: { mfaPendingSecret: null } });
  } catch {
    // Nothing pending or no row: nothing to cancel.
  }
}

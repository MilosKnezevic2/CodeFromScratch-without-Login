import { generateSecret, generateURI, verifySync } from "otplib";
import { toDataURL } from "qrcode";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * MFA (TOTP) service — TASK-103 per Firm B plan.md.
 *
 * Responsibilities:
 * - Generate a new TOTP secret for first-time enrolment.
 * - Produce an `otpauth://` URI and an SVG/PNG QR code so the user
 *   can scan it in Google Authenticator / 1Password / Authy.
 * - Verify TOTP codes on subsequent logins.
 * - Generate and verify single-use backup codes so a lost
 *   authenticator device doesn't lock the user out.
 *
 * Secret storage:
 * - The raw TOTP secret is encrypted with AES-256-GCM before
 *   it touches the database (column: `User.mfaSecret`). The key
 *   is derived from `NEXTAUTH_SECRET` so it rotates when the app's
 *   primary secret rotates. We never store the secret plaintext.
 *
 * Backup codes:
 * - Generated as 10 × 10-char hex strings (~40 bits of entropy
 *   each).
 * - Shown to the user once at enrol time. Then each code is bcrypt
 *   hashed and stored in `User.mfaBackupCodes`. On verification,
 *   the matching hash is removed from the array — single-use.
 *
 * TOTP parameters:
 * - 30-second time step (standard, works with every authenticator)
 * - 6-digit codes
 * - 1-step window on each side (±30s) — usability tolerance
 *
 * `otplib` handles RFC 6238 compliance; we configure the window
 * and digits explicitly so behavior is obvious.
 */

const APP_NAME = "CodeFromScratch";
// Seconds of tolerance applied on both sides of the current 30-second
// TOTP step, so an auth code the user typed just as the window rolled
// over is still accepted.
const TOTP_TOLERANCE_SECONDS: [number, number] = [30, 30];
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_BYTES = 5; // 5 bytes → 10 hex chars
const ENC_ALGORITHM = "aes-256-gcm";
const ENC_IV_LENGTH = 12;

function deriveEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "NEXTAUTH_SECRET (or AUTH_SECRET) must be set and at least 32 characters for MFA secret encryption.",
    );
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = deriveEncryptionKey();
  const iv = randomBytes(ENC_IV_LENGTH);
  const cipher = createCipheriv(ENC_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split(".");
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("MFA secret payload malformed — expected iv.tag.data.");
  }
  const key = deriveEncryptionKey();
  const iv = Buffer.from(ivPart, "base64");
  const authTag = Buffer.from(tagPart, "base64");
  const data = Buffer.from(dataPart, "base64");
  const decipher = createDecipheriv(ENC_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export type EnrolmentArtifacts = {
  encryptedSecret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
  backupCodesPlain: string[];
  backupCodesHashed: string[];
};

/**
 * Produce everything the client needs to show the user at first-time
 * MFA enrolment. Caller is responsible for persisting
 * `encryptedSecret` + `backupCodesHashed` to the User row BEFORE
 * returning the plaintext codes to the user.
 */
export async function createEnrolment(userEmail: string): Promise<EnrolmentArtifacts> {
  const secret = generateSecret();
  const otpauthUri = generateURI({
    issuer: APP_NAME,
    label: userEmail,
    secret,
  });
  const qrCodeDataUrl = await toDataURL(otpauthUri);
  const encryptedSecret = encryptSecret(secret);

  const backupCodesPlain: string[] = [];
  const backupCodesHashed: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = randomBytes(BACKUP_CODE_BYTES).toString("hex").toUpperCase();
    backupCodesPlain.push(code);
    backupCodesHashed.push(await bcrypt.hash(code, 12));
  }

  return {
    encryptedSecret,
    otpauthUri,
    qrCodeDataUrl,
    backupCodesPlain,
    backupCodesHashed,
  };
}

/**
 * Verify a 6-digit TOTP code against the user's stored encrypted
 * secret. Returns true if valid within the ±30s window.
 */
export function verifyTotpCode(encryptedSecret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  let secret: string;
  try {
    secret = decryptSecret(encryptedSecret);
  } catch {
    return false;
  }
  try {
    const result = verifySync({
      token: code,
      secret,
      epochTolerance: TOTP_TOLERANCE_SECONDS,
    });
    return result.valid === true;
  } catch {
    return false;
  }
}

/**
 * Verify a single-use backup code. Returns the remaining hashed
 * codes (with the matching one removed) on success, or null on
 * failure. Caller persists the new array to the User row.
 */
export async function consumeBackupCode(
  submittedCode: string,
  storedHashes: string[],
): Promise<string[] | null> {
  const normalized = submittedCode.trim().toUpperCase();
  if (!/^[0-9A-F]{10}$/.test(normalized)) return null;

  for (let i = 0; i < storedHashes.length; i++) {
    const hash = storedHashes[i];
    if (!hash) continue;
    const match = await bcrypt.compare(normalized, hash);
    if (match) {
      // Remove the used code (single-use).
      return storedHashes.filter((_, idx) => idx !== i);
    }
  }
  return null;
}

/**
 * Format a backup code for display — splits the 10-char hex string
 * into two 5-char groups separated by a dash.
 */
export function formatBackupCode(code: string): string {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

/**
 * Constant-time string equality. Exported for callers that need to
 * compare user-provided MFA tokens against known-good values
 * without timing-leak.
 */
export function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

import { verifySync } from "otplib";

/**
 * Admin-portal MFA — separate from the user-account MFA in
 * lib/services/mfa.ts because the admin auth model has no
 * database row to attach a secret to. Instead, the secret lives
 * in the environment as `CFS_ADMIN_MFA_SECRET` (base32, the same
 * format the authenticator app accepts on manual entry).
 *
 * When the env var is unset, admin login keeps working with just
 * username + password — the operator can flip MFA on later by
 * setting the env var without touching code.
 *
 * To generate a secret once:
 *   node -e "import('otplib').then(m => console.log(m.generateSecret()))"
 * Then either scan the otpauth URI or paste the base32 secret into
 * the authenticator app, and put the same value in
 * `CFS_ADMIN_MFA_SECRET=<base32>` in your env.
 */

export function isAdminMfaConfigured(): boolean {
  const secret = process.env.CFS_ADMIN_MFA_SECRET;
  return typeof secret === "string" && secret.length > 0;
}

export function verifyAdminTotpCode(code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const secret = process.env.CFS_ADMIN_MFA_SECRET;
  if (!secret) return false;
  try {
    const result = verifySync({
      token: code,
      secret,
      epochTolerance: [30, 30],
    });
    return result.valid === true;
  } catch {
    return false;
  }
}

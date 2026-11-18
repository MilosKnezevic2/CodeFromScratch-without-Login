import { readAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

/**
 * Server-side revocation for the signed admin cookie.
 *
 * The cookie alone proves "issued by our login and not expired", which means
 * a copied cookie kept working for its whole 24 hours, through logout and a
 * password change. Every revocation is now a line in the admin activity log
 * (no schema change: the table already exists and is indexed by time), and a
 * session counts only when it was issued at or after the newest such line.
 *
 * The timestamp is written from the app clock, the same clock that stamps the
 * cookie, so a sign-in right after a revocation is never judged by a database
 * clock that runs a little ahead.
 */

export const REVOKE_ACTION = "sessions.revoked";

export type RevokeReason = "logout" | "password-changed" | "mfa-enabled" | "mfa-disabled";

/** Ends every admin session issued before this moment. Throws when it cannot be recorded. */
export async function revokeAdminSessions(reason: RevokeReason, ip: string | null, now = new Date()): Promise<Date> {
  await prisma.adminAuditLog.create({
    data: { action: REVOKE_ACTION, detail: { reason }, ip: ip ?? undefined, createdAt: now },
  });
  return now;
}

async function revokedSince(): Promise<Date | null> {
  const latest = await prisma.adminAuditLog.findFirst({
    where: { action: REVOKE_ACTION },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return latest?.createdAt ?? null;
}

/**
 * True when the cookie is genuine, current and not revoked. Fails closed: when
 * the database cannot answer, the session does not count (every admin page and
 * action needs the database anyway).
 */
export async function isAdminSessionActive(token: string | undefined | null): Promise<boolean> {
  const session = await readAdminSession(token);
  if (!session) return false;
  let since: Date | null;
  try {
    since = await revokedSince();
  } catch (error) {
    console.error("Admin session revocation could not be checked:", error);
    return false;
  }
  return since === null || session.issuedAt.getTime() >= since.getTime();
}

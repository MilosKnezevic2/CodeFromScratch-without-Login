import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type ValidatedUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaBackupCodes: string[];
};

/**
 * Look up a user by email and verify their password.
 *
 * Returns the user (with the fields the auth layer needs) on
 * success, or null on any failure — wrong email, wrong password,
 * banned account, OAuth-only account (no passwordHash). Failures
 * intentionally collapse to a single null return so the caller
 * can produce a single generic error to the client and not leak
 * which of the three conditions was hit.
 */
export async function verifyPassword(
  email: string,
  password: string,
): Promise<ValidatedUser | null> {
  if (!email || !password) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      passwordHash: true,
      banned: true,
      mfaEnabled: true,
      mfaSecret: true,
      mfaBackupCodes: true,
    },
  });

  if (!user || !user.passwordHash || user.banned) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    passwordHash: user.passwordHash,
    mfaEnabled: user.mfaEnabled,
    mfaSecret: user.mfaSecret,
    mfaBackupCodes: user.mfaBackupCodes,
  };
}

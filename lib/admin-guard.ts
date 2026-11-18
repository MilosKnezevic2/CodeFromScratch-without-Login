import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-session";
import { isAdminSessionActive } from "@/lib/admin-session-store";

/**
 * True when the request carries the portal's signed admin cookie
 * (cfs-admin-token), which only the portal login issues, after the password
 * and, when switched on, the two-step code, and that session has not been
 * revoked since (logout, password or two-step change).
 *
 * A reader account with role ADMIN used to count as well. With reader
 * sign-in open that was a second door into every admin route that skipped
 * the portal's lockout and 2FA, so it is gone: reader accounts never reach
 * the admin.
 */
export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return isAdminSessionActive(store.get(ADMIN_COOKIE)?.value);
}

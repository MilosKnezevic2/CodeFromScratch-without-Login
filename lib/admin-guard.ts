import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/admin-session";

/**
 * True when the request carries the portal's signed admin cookie
 * (cfs-admin-token), which only the portal login issues, after the password
 * and, when switched on, the two-step code.
 *
 * A reader account with role ADMIN used to count as well. With reader
 * sign-in open that was a second door into every admin route that skipped
 * the portal's lockout and 2FA, so it is gone: reader accounts never reach
 * the admin.
 */
export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminSession(store.get("cfs-admin-token")?.value);
}

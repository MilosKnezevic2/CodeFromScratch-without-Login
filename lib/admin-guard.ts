import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { verifyAdminSession } from "@/lib/admin-session";

/**
 * True when the request comes from the admin. The portal logs in with its own
 * signed cookie (cfs-admin-token), while these routes used to accept only a
 * NextAuth ADMIN session, so a portal login could never reach them. Both count.
 */
export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  if (await verifyAdminSession(store.get("cfs-admin-token")?.value)) return true;
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

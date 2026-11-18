import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, verifyAdminSession } from "@/lib/admin-session";
import { revokeAdminSessions } from "@/lib/admin-session-store";
import { clientIp, recordAudit } from "@/lib/audit";

/**
 * Ends the admin session on every device: a copied cookie stops working too.
 * The cookie is cleared whether or not it was valid.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (await verifyAdminSession(token)) {
    const ip = clientIp(request.headers);
    await recordAudit("logout", {}, ip);
    try {
      await revokeAdminSessions("logout", ip);
    } catch (error) {
      // This browser is still signed out below; other copies of the cookie
      // live on until they expire, which the log line makes visible.
      console.error("Logout could not end other admin sessions:", error);
    }
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", adminCookieOptions(0));
  return response;
}

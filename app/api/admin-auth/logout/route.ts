import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { clientIp, recordAudit } from "@/lib/audit";

/** Ends the admin session. The cookie is cleared whether or not it was valid. */
export async function POST(request: NextRequest) {
  const token = request.cookies.get("cfs-admin-token")?.value;
  if (await verifyAdminSession(token)) {
    await recordAudit("logout", {}, clientIp(request.headers));
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set("cfs-admin-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

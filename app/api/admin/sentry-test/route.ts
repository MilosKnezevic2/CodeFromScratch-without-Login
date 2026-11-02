import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

/**
 * Throws on purpose so the admin can see a server error arrive in Sentry
 * (Settings > System links here). Anyone else gets a plain 403.
 */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  throw new Error(`Sentry test from the admin portal (${new Date().toISOString()})`);
}

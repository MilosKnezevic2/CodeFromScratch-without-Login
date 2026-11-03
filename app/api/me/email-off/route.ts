import { NextResponse } from "next/server";
import { verifyEmailOff } from "@/lib/reader/emails";
import { turnEmailOff } from "@/lib/reader/email-off";

export const dynamic = "force-dynamic";

/** RFC 8058 one-click: the mail client's own unsubscribe button POSTs here. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const target = verifyEmailOff(url.searchParams.get("u"), url.searchParams.get("k"), url.searchParams.get("t"));
  if (!target) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  await turnEmailOff(target.userId, target.kind);
  return NextResponse.json({ ok: true });
}

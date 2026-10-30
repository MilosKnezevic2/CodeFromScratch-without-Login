import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { WAITLIST_CONFIRM_WINDOW_MS } from "@/lib/course-waitlist";

/**
 * Confirmation is a mutation, so it happens on POST from the button on the
 * interstitial page; mail scanners prefetch GET links and must not be able to
 * confirm anyone.
 */
export async function POST(request: Request) {
  let rawToken = "";
  try {
    const body = await request.json();
    rawToken = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    // Missing or malformed body is handled below as a missing token.
  }
  if (!rawToken || rawToken.length > 128) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  try {
    const entry = await prisma.courseWaitlist.findFirst({ where: { confirmToken: hashedToken } });
    if (!entry) return NextResponse.json({ status: "invalid" });
    if (entry.confirmed) return NextResponse.json({ status: "already" });
    if (Date.now() - entry.updatedAt.getTime() > WAITLIST_CONFIRM_WINDOW_MS) {
      return NextResponse.json({ status: "expired" });
    }
    await prisma.courseWaitlist.update({ where: { id: entry.id }, data: { confirmed: true } });
    return NextResponse.json({ status: "confirmed" });
  } catch (error) {
    console.error("Waitlist confirm error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

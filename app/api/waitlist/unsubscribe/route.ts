import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Removing yourself deletes the row: no email, level or note is kept. */
export async function POST(request: Request) {
  let token = "";
  try {
    const body = await request.json();
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    // Missing or malformed body is handled below as a missing token.
  }
  if (!token || token.length > 128) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  try {
    const entry = await prisma.courseWaitlist.findFirst({ where: { unsubscribeToken: token } });
    if (!entry) return NextResponse.json({ status: "invalid" });
    await prisma.courseWaitlist.delete({ where: { id: entry.id } });
    return NextResponse.json({ status: "unsubscribed" });
  } catch (error) {
    console.error("Waitlist unsubscribe error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

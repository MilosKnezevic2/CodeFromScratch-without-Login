import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/** Unconfirmed sign-ups must confirm within this window; re-subscribing
 *  issues a fresh token and restarts it. */
const CONFIRM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Legacy entry point: confirmation emails used to link here directly and a
 * GET would flip the subscription. Mail scanners (Outlook SafeLinks, Gmail)
 * prefetch GET links, which silently confirmed subscriptions nobody asked
 * for — so GET now only forwards to the interstitial page; the mutation
 * happens in POST when the reader actually presses the button.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const target = new URL("/newsletter/confirm", url.origin);
  if (token) target.searchParams.set("token", token);
  return NextResponse.redirect(target, 307);
}

export async function POST(request: Request) {
  let rawToken = "";
  try {
    const body = await request.json();
    rawToken = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    // Malformed or missing JSON body — handled below as a missing token.
  }

  if (!rawToken || rawToken.length > 128) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  try {
    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: { confirmToken: hashedToken },
    });

    if (!subscriber) {
      return NextResponse.json({ status: "invalid" });
    }

    // Idempotent: the token survives confirmation, so re-clicking the email
    // link reports success instead of "invalid link".
    if (subscriber.confirmed) {
      return NextResponse.json({ status: "already" });
    }

    if (Date.now() - subscriber.updatedAt.getTime() > CONFIRM_WINDOW_MS) {
      return NextResponse.json({ status: "expired" });
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { confirmed: true },
    });

    return NextResponse.json({ status: "confirmed" });
  } catch (error) {
    // Postgres paused/unreachable — the exact free-tier scenario. A clean
    // status lets the page say "try again in a minute" instead of a raw 500.
    console.error("Newsletter confirm error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

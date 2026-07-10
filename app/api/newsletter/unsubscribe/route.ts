import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Unsubscribing is a mutation, so it happens on POST — mail scanners
 * prefetch GET links and were able to silently unsubscribe readers. GET only
 * forwards to the interstitial page with the confirm button.
 *
 * The token is compared against the stored value directly (not re-hashed):
 * campaign emails can only ever link what the DB holds, so hashing the
 * incoming value a second time made every unsubscribe link fail the lookup.
 * The stored token is single-purpose and low-privilege — a leak can do
 * nothing worse than unsubscribe one address.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const target = new URL("/newsletter/unsubscribe", url.origin);
  if (token) target.searchParams.set("token", token);
  return NextResponse.redirect(target, 307);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  // RFC 8058 one-click (List-Unsubscribe-Post) sends a form body with the
  // token in the URL; our own page sends JSON. Accept both.
  let token = url.searchParams.get("token") ?? "";
  if (!token) {
    try {
      const body = await request.json();
      token = typeof body.token === "string" ? body.token.trim() : "";
    } catch {
      // Form-encoded or empty body — the query param path already covered
      // one-click; anything else is handled below as a missing token.
    }
  }

  if (!token || token.length > 128) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      // Unknown token or already unsubscribed — nothing to reveal either way.
      return NextResponse.json({ status: "invalid" });
    }

    await prisma.newsletterSubscriber.delete({
      where: { id: subscriber.id },
    });

    return NextResponse.json({ status: "unsubscribed" });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

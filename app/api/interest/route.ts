import { NextResponse } from "next/server";

/**
 * Retired. This endpoint used to write any posted address straight into the
 * newsletter table as already confirmed, with no consent check and no rate
 * limit, so anyone could subscribe someone else and trigger an admin email.
 * Sign-ups now go through double opt-in: /api/newsletter/subscribe and
 * /api/waitlist/subscribe. The hidden ebook and course pages that still call
 * this route will show their error state until they are rebuilt for relaunch.
 */
export function POST() {
  return NextResponse.json(
    { error: "This sign-up is closed. Use /newsletter or /course-waitlist." },
    { status: 410 },
  );
}

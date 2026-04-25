import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Exits Next.js draft mode and redirects to the public version of
 * the page. Called from the "Exit draft mode" banner, or directly.
 */
export async function GET() {
  const mode = await draftMode();
  mode.disable();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}

import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { SITE_URL, renderLetter } from "@/lib/emails/newsletter-letter";
import { parseLetterInput } from "@/lib/newsletter/input";
import { buildLetterContent } from "@/lib/newsletter/service";

/** Renders the letter with the real template, so the preview cannot drift from what is sent. */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = parseLetterInput(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const content = await buildLetterContent(parsed.value);
  if (!content) {
    return NextResponse.json({ error: "That article does not exist." }, { status: 400 });
  }

  return NextResponse.json({ html: renderLetter(content, `${SITE_URL()}/newsletter`) });
}

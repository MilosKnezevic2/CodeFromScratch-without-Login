import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishedSlugs } from "@/lib/analytics/store";
import { BURST, DAILY, initialStatus, isPostSlug, parseCommentBody } from "@/lib/comments";
import { commentsOpen, currentReader, listComments } from "@/lib/comments-store";
import { sendEmail } from "@/lib/send-email";
import { getSettings } from "@/lib/settings/store";
import { escapeHtml } from "@/lib/emails/newsletter-letter";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ postSlug: string }> };

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_request: Request, { params }: Params) {
  const { postSlug } = await params;
  if (!isPostSlug(postSlug)) return json({ error: "Not found" }, 404);
  if (!(await commentsOpen())) return json({ open: false, comments: [] });
  try {
    const reader = await currentReader();
    return json({ open: true, comments: await listComments(postSlug, reader?.id ?? null) });
  } catch (error) {
    console.error("Comments could not be read:", error);
    return json({ error: "Comments are not available right now." }, 503);
  }
}

export async function POST(request: Request, { params }: Params) {
  const { postSlug } = await params;
  if (!isPostSlug(postSlug)) return json({ error: "Not found" }, 404);
  if (!(await commentsOpen())) return json({ error: "Comments are closed." }, 403);

  const reader = await currentReader();
  if (!reader) return json({ error: "Sign in to comment." }, 401);

  const slugs = await publishedSlugs();
  if (slugs && !slugs.has(postSlug)) return json({ error: "Not found" }, 404);

  const input = (await request.json().catch(() => null)) as { body?: unknown; parentId?: unknown } | null;
  const parsed = parseCommentBody(input?.body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  // A reply answers a published comment on the same article; anything else is refused.
  let parentId: string | null = null;
  if (input?.parentId !== undefined && input.parentId !== null) {
    if (typeof input.parentId !== "string" || input.parentId.length > 40) return json({ error: "That comment does not exist." }, 400);
    const parent = await prisma.postComment.findFirst({
      where: { id: input.parentId, postSlug, status: "APPROVED", deletedAt: null },
      select: { id: true },
    });
    if (!parent) return json({ error: "That comment does not exist any more." }, 400);
    parentId = parent.id;
  }

  const now = Date.now();
  const [burst, daily, approvedBefore] = await Promise.all([
    prisma.postComment.count({ where: { userId: reader.id, createdAt: { gt: new Date(now - BURST.windowMs) } } }),
    prisma.postComment.count({ where: { userId: reader.id, createdAt: { gt: new Date(now - DAILY.windowMs) } } }),
    prisma.postComment.count({ where: { userId: reader.id, status: "APPROVED" } }),
  ]);
  if (burst >= BURST.count || daily >= DAILY.count) {
    return json({ error: "That is a lot of comments in a short time. Try again a little later." }, 429);
  }

  const { features } = await getSettings();
  const status = initialStatus(approvedBefore > 0, parsed.body, features.holdFirstComment);
  const comment = await prisma.postComment.create({
    data: { postSlug, userId: reader.id, body: parsed.body, status, parentId },
    select: { id: true },
  });

  if (status === "PENDING") {
    // One short note to the site's inbox; a failed email must not lose the comment.
    const { general } = await getSettings();
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";
    await sendEmail({
      to: general.contactEmail,
      subject: `Comment waiting for approval on ${postSlug}`,
      html: `<p>${escapeHtml(reader.name ?? "A reader")} wrote on <a href="${site}/blog/${postSlug}">${postSlug}</a>:</p><blockquote>${escapeHtml(parsed.body).replace(/\n/g, "<br>")}</blockquote><p><a href="${site}/portal-cfs-admin/comments">Approve or reject it in the portal</a>.</p>`,
    }).catch((error: unknown) => console.error("Comment notification failed:", error));
  }

  return json({ id: comment.id, status }, 201);
}

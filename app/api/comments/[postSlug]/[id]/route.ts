import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REPORTS_TO_HIDE } from "@/lib/comments";
import { commentsOpen, currentReader } from "@/lib/comments-store";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ postSlug: string; id: string }> };

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** The author removes their own comment. */
export async function DELETE(_request: Request, { params }: Params) {
  const { postSlug, id } = await params;
  const reader = await currentReader();
  if (!reader) return json({ error: "Sign in first." }, 401);
  const { count } = await prisma.postComment.updateMany({
    where: { id, postSlug, userId: reader.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return count ? json({ deleted: true }) : json({ error: "Not found" }, 404);
}

/** Any signed-in reader can report a published comment; enough reports send it back to moderation. */
export async function POST(_request: Request, { params }: Params) {
  const { postSlug, id } = await params;
  if (!(await commentsOpen())) return json({ error: "Comments are closed." }, 403);
  const reader = await currentReader();
  if (!reader) return json({ error: "Sign in to report a comment." }, 401);
  if (!rateLimit(`comment-report:${reader.id}:${id}`, 1, 24 * 60 * 60 * 1000).success) {
    return json({ reported: true });
  }
  const comment = await prisma.postComment.findFirst({
    where: { id, postSlug, status: "APPROVED", deletedAt: null },
    select: { reportedCount: true, userId: true },
  });
  if (!comment || comment.userId === reader.id) return json({ error: "Not found" }, 404);
  const reportedCount = comment.reportedCount + 1;
  await prisma.postComment.update({
    where: { id },
    data: { reportedCount, ...(reportedCount >= REPORTS_TO_HIDE && { status: "PENDING" }) },
  });
  return json({ reported: true });
}

import { prisma } from "@/lib/prisma";
import { getDeskPosts, getPostCards } from "@/lib/sanity/queries";
import { sendEmail } from "@/lib/send-email";
import { emailOffHeaders, emailOffLinks, reminderEmail, replyEmail, type ReminderItem } from "./emails";
import { minutesLeft, READ_AT_PERCENT, weekProgress } from "./rules";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";

/**
 * Emails the authors of the comments these replies answer, when they turned
 * reply emails on. Called once a reply is published (straight away, or on
 * approval); a failed email is logged and never undoes the publishing.
 */
export async function notifyReplies(commentIds: string[]): Promise<number> {
  if (commentIds.length === 0) return 0;
  const replies = await prisma.postComment.findMany({
    where: { id: { in: commentIds }, status: "APPROVED", deletedAt: null, parentId: { not: null } },
    select: {
      id: true,
      postSlug: true,
      body: true,
      userId: true,
      user: { select: { name: true } },
      parent: {
        select: { body: true, deletedAt: true, status: true, userId: true, user: { select: { email: true, notifyReplies: true, banned: true } } },
      },
    },
  });
  const due = replies.filter(
    (r) => r.parent && !r.parent.deletedAt && r.parent.status === "APPROVED" && r.parent.userId !== r.userId && r.parent.user.notifyReplies && !r.parent.user.banned,
  );
  if (due.length === 0) return 0;
  const cards = await getPostCards([...new Set(due.map((r) => r.postSlug))]).catch(() => new Map<string, { title: string }>());

  let sent = 0;
  for (const r of due) {
    const parent = r.parent;
    if (!parent) continue;
    const { subject, html, text } = replyEmail({
      replierName: r.user.name ?? "A reader",
      postTitle: cards.get(r.postSlug)?.title ?? r.postSlug,
      replyUrl: `${SITE()}/blog/${r.postSlug}#comment-${r.id}`,
      reply: r.body,
      original: parent.body,
      offUrl: emailOffLinks(parent.userId, "replies").page,
    });
    try {
      await sendEmail({ to: parent.user.email, subject, html, text, headers: emailOffHeaders(parent.userId, "replies") });
      sent++;
    } catch (error) {
      console.error("Reply email failed:", error);
    }
  }
  return sent;
}

/** Resend's free plan allows 100 emails a day; the reminder leaves room for everything else. */
export const REMINDER_BATCH = 60;

/**
 * The Sunday reminder for every reader who turned it on and was not sent one
 * in the last five days. Readers with nothing unfinished and nothing saved
 * get no email.
 */
export async function sendWeeklyReminders(now = new Date()): Promise<{ sent: number; skipped: number; failed: number }> {
  const recently = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const readers = await prisma.user.findMany({
    where: { weeklyReminder: true, banned: false, OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: recently } }] },
    orderBy: { lastReminderAt: { sort: "asc", nulls: "first" } },
    take: REMINDER_BATCH,
    select: {
      id: true,
      name: true,
      email: true,
      weeklyGoal: true,
      readingHistory: { orderBy: { readAt: "desc" }, select: { postSlug: true, scrollPercent: true, lastPercent: true, completedAt: true } },
      savedPosts: { orderBy: { createdAt: "desc" }, take: 20, select: { postSlug: true, createdAt: true } },
    },
  });
  if (readers.length === 0) return { sent: 0, skipped: 0, failed: 0 };
  const posts = new Map((await getDeskPosts()).map((p) => [p.slug, p]));

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const r of readers) {
    const opened = new Set(r.readingHistory.map((h) => h.postSlug));
    const unfinished: ReminderItem[] = r.readingHistory
      .filter((h) => !h.completedAt && h.scrollPercent < READ_AT_PERCENT && posts.has(h.postSlug))
      .slice(0, 3)
      .map((h) => {
        const post = posts.get(h.postSlug);
        const mins = minutesLeft(post?.readingTime, h.lastPercent);
        return { title: post?.title ?? h.postSlug, url: `${SITE()}/blog/${h.postSlug}`, note: `${h.lastPercent}% read${mins ? ` · ${mins} min left` : ""}` };
      });
    const saved: ReminderItem[] = r.savedPosts
      .filter((s) => !opened.has(s.postSlug) && posts.has(s.postSlug))
      .slice(0, 3)
      .map((s) => {
        const post = posts.get(s.postSlug);
        const day = s.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        return { title: post?.title ?? s.postSlug, url: `${SITE()}/blog/${s.postSlug}`, note: `Saved ${day}${post?.readingTime ? ` · ${post.readingTime} min` : ""}` };
      });
    const week = weekProgress(
      r.readingHistory.flatMap((h) => (h.completedAt ? [h.completedAt] : [])),
      r.weeklyGoal,
      now,
    );
    const email = reminderEmail({
      firstName: r.name?.split(" ")[0] ?? null,
      thisWeek: week.thisWeek,
      goal: week.goal,
      streak: week.streak,
      unfinished,
      saved,
      dashboardUrl: `${SITE()}/dashboard`,
      offUrl: emailOffLinks(r.id, "reminder").page,
    });
    // Stamped either way, so a reader with nothing to read is not looked at again until next week.
    await prisma.user.update({ where: { id: r.id }, data: { lastReminderAt: now } });
    if (!email) {
      skipped++;
      continue;
    }
    try {
      await sendEmail({ to: r.email, ...email, headers: emailOffHeaders(r.id, "reminder") });
      sent++;
    } catch (error) {
      failed++;
      console.error("Sunday reminder failed:", error);
    }
  }
  return { sent, skipped, failed };
}

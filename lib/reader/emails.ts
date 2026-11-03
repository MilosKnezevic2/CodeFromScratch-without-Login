import { createHmac, timingSafeEqual } from "node:crypto";
import { escapeHtml } from "@/lib/emails/newsletter-letter";

/**
 * The two opt-in reader emails: a reply to a comment, and the Sunday
 * reminder. Builders here are pure (tested); sending lives with the callers.
 */

export type EmailKind = "replies" | "reminder";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s || s.length < 32) throw new Error("NEXTAUTH_SECRET is missing or short; reader email links cannot be signed.");
  return s;
}

/** Signs "turn this email off for this reader", so the link works without logging in and only for that reader. */
export function emailOffToken(userId: string, kind: EmailKind): string {
  return createHmac("sha256", secret()).update(`email-off:${kind}:${userId}`).digest("base64url");
}

export function verifyEmailOff(userId: unknown, kind: unknown, token: unknown): { userId: string; kind: EmailKind } | null {
  if (typeof userId !== "string" || typeof token !== "string" || (kind !== "replies" && kind !== "reminder")) return null;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(userId)) return null;
  const expected = Buffer.from(emailOffToken(userId, kind));
  const given = Buffer.from(token);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return { userId, kind };
}

export function emailOffLinks(userId: string, kind: EmailKind) {
  const q = `u=${encodeURIComponent(userId)}&k=${kind}&t=${emailOffToken(userId, kind)}`;
  return {
    // The footer link opens a page with a button: mail scanners that follow links change nothing.
    page: `${SITE()}/email-off?${q}`,
    // RFC 8058 one-click target for the unsubscribe button Gmail and Outlook show.
    oneClick: `${SITE()}/api/me/email-off?${q}`,
  };
}

export function emailOffHeaders(userId: string, kind: EmailKind): Record<string, string> {
  return {
    "List-Unsubscribe": `<${emailOffLinks(userId, kind).oneClick}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function frame(inner: string, footer: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px" cellpadding="0" cellspacing="0"><tr><td style="padding:32px">
${inner}
</td></tr></table>
<p style="margin:16px 0 0;max-width:560px;font-size:12px;line-height:1.6;color:#64748b">${footer}</p>
</td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#0f766e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">${escapeHtml(label)}</a>`;

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export interface ReplyEmailInput {
  replierName: string;
  postTitle: string;
  replyUrl: string;
  reply: string;
  original: string;
  offUrl: string;
}

export function replyEmail(input: ReplyEmailInput): { subject: string; html: string; text: string } {
  const reply = clip(input.reply, 600);
  const original = clip(input.original, 200);
  const footer = `You get this because you turned on reply emails in your CodeFromScratch profile. <a href="${escapeHtml(input.offUrl)}" style="color:#64748b">Turn reply emails off</a>.`;
  return {
    subject: `${clip(input.replierName, 40)} replied to your comment`,
    html: frame(
      `<p style="margin:0 0 6px;font-size:13px;color:#64748b">On “${escapeHtml(input.postTitle)}”</p>
<p style="margin:0 0 18px;font-size:20px;font-weight:700">${escapeHtml(input.replierName)} replied to your comment</p>
<p style="margin:0 0 6px;font-size:13px;color:#64748b">You wrote:</p>
<p style="margin:0 0 18px;padding-left:12px;border-left:3px solid #e2e8f0;font-size:14px;line-height:1.6;color:#475569;white-space:pre-line">${escapeHtml(original)}</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#0f172a;white-space:pre-line">${escapeHtml(reply)}</p>
${button(input.replyUrl, "See the reply")}`,
      footer,
    ),
    text: `${input.replierName} replied to your comment on "${input.postTitle}".\n\nYou wrote:\n${original}\n\nThe reply:\n${reply}\n\nSee it: ${input.replyUrl}\n\nYou get this because you turned on reply emails. Turn them off: ${input.offUrl}`,
  };
}

export interface ReminderItem {
  title: string;
  url: string;
  /** "64% read · 9 min left" or "Saved 2 Nov · 12 min". */
  note: string;
}

export interface ReminderInput {
  firstName: string | null;
  thisWeek: number;
  goal: number;
  streak: number;
  unfinished: ReminderItem[];
  saved: ReminderItem[];
  dashboardUrl: string;
  offUrl: string;
}

/** The Sunday reminder, or null when there is nothing worth an email. */
export function reminderEmail(input: ReminderInput): { subject: string; html: string; text: string } | null {
  if (input.unfinished.length === 0 && input.saved.length === 0) return null;
  const left = Math.max(0, input.goal - input.thisWeek);
  const goalLine =
    left === 0
      ? `You reached your goal this week${input.streak > 1 ? `: ${input.streak} weeks in a row` : ""}.`
      : `${input.thisWeek} of ${input.goal} articles this week. ${left === 1 ? "One more" : `${left} more`} before Monday ${input.streak > 0 ? `keeps your ${input.streak}-week streak` : "starts a streak"}.`;
  const list = (title: string, items: ReminderItem[]) =>
    items.length === 0
      ? ""
      : `<p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#64748b">${title}</p>
${items
  .map(
    (i) =>
      `<p style="margin:0 0 12px"><a href="${escapeHtml(i.url)}" style="font-size:16px;font-weight:700;color:#0f766e;text-decoration:none">${escapeHtml(i.title)}</a><br><span style="font-size:13px;color:#64748b">${escapeHtml(i.note)}</span></p>`,
  )
  .join("\n")}`;
  const hello = input.firstName ? `Hi ${escapeHtml(input.firstName)},` : "Hi,";
  const footer = `You get this on Sundays because you turned on the reminder in your CodeFromScratch profile. <a href="${escapeHtml(input.offUrl)}" style="color:#64748b">Turn the Sunday reminder off</a>.`;
  const textList = (title: string, items: ReminderItem[]) =>
    items.length === 0 ? "" : `\n\n${title}\n${items.map((i) => `- ${i.title} (${i.note})\n  ${i.url}`).join("\n")}`;
  return {
    subject: input.unfinished.length > 0 ? `You left ${input.unfinished.length === 1 ? "an article" : `${input.unfinished.length} articles`} half-read` : "Your reading list for the week",
    html: frame(
      `<p style="margin:0 0 12px;font-size:20px;font-weight:700">${hello}</p>
<p style="margin:0;font-size:15px;line-height:1.65;color:#334155">${escapeHtml(goalLine)}</p>
${list("Pick up where you left off", input.unfinished)}
${list("Waiting in your library", input.saved)}
<p style="margin:28px 0 0">${button(input.dashboardUrl, "Open your dashboard")}</p>`,
      footer,
    ),
    text: `${input.firstName ? `Hi ${input.firstName},` : "Hi,"}\n\n${goalLine}${textList("Pick up where you left off", input.unfinished)}${textList("Waiting in your library", input.saved)}\n\nYour dashboard: ${input.dashboardUrl}\n\nTurn the Sunday reminder off: ${input.offUrl}`,
  };
}

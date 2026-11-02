import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/send-email";
import { escapeHtml } from "@/lib/emails/newsletter-letter";

/** A sign-in link is valid this long, and used once. */
export const LINK_MAX_AGE_S = 30 * 60;

/** Links one address may request while earlier ones are still valid. */
export const PER_ADDRESS = 3;

/**
 * Valid links across the whole site at any moment. The email quota is shared
 * with the newsletter (100 a day on Resend's free plan), so someone typing
 * other people's addresses in a loop cannot use it up.
 */
export const SITE_WIDE = 40;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(input: string): string {
  const email = input.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new Error("Invalid email address");
  return email;
}

/**
 * Whether another link may go out now. Counted in the database (unexpired
 * VerificationToken rows), so it holds across server instances.
 */
export async function linkAllowed(email: string): Promise<boolean> {
  const now = new Date();
  const [forAddress, total] = await Promise.all([
    prisma.verificationToken.count({ where: { identifier: email, expires: { gt: now } } }),
    prisma.verificationToken.count({ where: { expires: { gt: now } } }),
  ]);
  return forAddress < PER_ADDRESS && total < SITE_WIDE;
}

export function signInLinkEmail(url: string): { subject: string; html: string; text: string } {
  const safe = escapeHtml(url);
  return {
    subject: "Your sign-in link for CodeFromScratch",
    html: `<!doctype html><html><body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px" cellpadding="0" cellspacing="0"><tr><td style="padding:32px">
<p style="margin:0 0 8px;font-size:20px;font-weight:700">Sign in to CodeFromScratch</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155">Press the button to sign in. The link works once and for 30 minutes.</p>
<a href="${safe}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#0f766e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Sign in</a>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b">If you did not ask for this, ignore the email: nothing happens without the click, and no account is created.</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#64748b">CodeFromScratch · office@codefromscratch.org</p>
</td></tr></table></body></html>`,
    text: `Sign in to CodeFromScratch\n\nOpen this link to sign in. It works once and for 30 minutes:\n${url}\n\nIf you did not ask for this, ignore the email: nothing happens without the click, and no account is created.\n\nCodeFromScratch · office@codefromscratch.org`,
  };
}

/** Auth.js calls this to deliver the link; it goes through the same sender as every other email. */
export async function sendSignInLink({ identifier, url }: { identifier: string; url: string }): Promise<void> {
  const { subject, html, text } = signInLinkEmail(url);
  await sendEmail({ to: identifier, subject, html, text });
}

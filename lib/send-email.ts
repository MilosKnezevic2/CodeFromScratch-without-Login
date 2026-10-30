import { getEmailFrom, getResend } from "@/lib/resend";

/** Plain-text fallback derived from our own simple email HTML. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<(style|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, label: string) => {
      const text = label.replace(/<[^>]+>/g, "").trim();
      return text === href ? href : `${text} (${href})`;
    })
    .replace(/<(br|\/p|\/div|\/tr|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, "·")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface SendEmailOptions {
  /** Overrides the sender's display name; the address always stays the verified one. */
  from?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  replyTo?: string;
}

/**
 * Resend reports most failures (quota, invalid sender) as a returned `error`,
 * not as a thrown exception. Unchecked, a failed send looks like a success and
 * the reader is told to check an inbox that will stay empty, so this throws.
 */
export async function sendEmail({ from, to, subject, html, text, headers, replyTo }: SendEmailOptions) {
  const result = await getResend().emails.send({
    from: from ?? getEmailFrom(),
    to,
    subject,
    html,
    text: text ?? htmlToPlainText(html),
    ...(headers ? { headers } : {}),
    ...(replyTo ? { replyTo } : {}),
  });
  if (result?.error) {
    throw new Error(`Email send failed: ${result.error.name}: ${result.error.message}`);
  }
  return result?.data ?? null;
}

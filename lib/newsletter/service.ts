import { prisma } from "@/lib/prisma";
import { getEmailFrom, getResend } from "@/lib/resend";
import { sendEmail } from "@/lib/send-email";
import {
  REPLY_TO,
  SITE_URL,
  renderLetter,
  renderLetterText,
  type LetterCard,
  type LetterContent,
} from "@/lib/emails/newsletter-letter";
import { getPostBySlug } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import type { LetterInput } from "@/lib/newsletter/input";

/** Resend's batch endpoint takes at most 100 emails per call. */
export const SEND_BATCH_SIZE = 100;

/** Unconfirmed sign-ups are personal data with no consent behind them. */
export const PENDING_RETENTION_DAYS = 30;

export function unsubscribeLinks(token: string) {
  const site = SITE_URL();
  return {
    // Footer link: the interstitial page, the mutation happens on its button.
    page: `${site}/newsletter/unsubscribe?token=${token}`,
    // RFC 8058 target for the unsubscribe button Gmail and Outlook show.
    oneClick: `${site}/api/newsletter/unsubscribe?token=${token}`,
  };
}

function unsubscribeHeaders(token: string) {
  return {
    "List-Unsubscribe": `<${unsubscribeLinks(token).oneClick}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** Builds the template content; the article always comes from Sanity, never from the form. */
export async function buildLetterContent(input: LetterInput): Promise<LetterContent | null> {
  let card: LetterCard | undefined;
  if (input.postSlug) {
    const post = await getPostBySlug(input.postSlug);
    if (!post) return null;
    card = {
      kicker: "New article",
      title: post.title,
      excerpt: post.excerpt,
      meta: post.readingTime ? `${post.readingTime} min read` : undefined,
      url: `${SITE_URL()}/blog/${post.slug.current}`,
      imageUrl: post.featuredImage?.asset
        ? urlFor(post.featuredImage).width(1052).quality(80).format("jpg").url()
        : undefined,
      imageAlt: post.featuredImage?.alt,
      cta: "Read the article",
    };
  }
  return {
    subject: input.subject,
    preheader: input.preheader || undefined,
    note: input.note || undefined,
    card,
  };
}

export interface LetterRecipient {
  email: string;
  unsubscribeToken: string;
}

/**
 * Sends one letter to many people through the batch endpoint. Each recipient
 * gets their own unsubscribe link. A failed batch is counted, not retried: a
 * retry could mail people twice, and the campaign row shows the failure.
 */
export async function sendLetterToRecipients(
  content: LetterContent,
  recipients: LetterRecipient[],
  campaignId: string,
): Promise<{ sent: number; failed: number }> {
  const resend = getResend();
  const from = getEmailFrom();
  let sent = 0;
  let failed = 0;

  for (let start = 0; start < recipients.length; start += SEND_BATCH_SIZE) {
    const chunk = recipients.slice(start, start + SEND_BATCH_SIZE);
    const payload = chunk.map((recipient) => {
      const { page } = unsubscribeLinks(recipient.unsubscribeToken);
      return {
        from,
        to: recipient.email,
        replyTo: REPLY_TO,
        subject: content.subject,
        html: renderLetter(content, page),
        text: renderLetterText(content, page),
        headers: unsubscribeHeaders(recipient.unsubscribeToken),
      };
    });

    try {
      const { data, error } = await resend.batch.send(payload, {
        idempotencyKey: `campaign-${campaignId}-${start}`,
        batchValidation: "permissive",
      });
      if (error || !data) {
        failed += chunk.length;
        console.error(`Newsletter batch failed: ${error?.name}: ${error?.message}`);
      } else {
        const rejected = data.errors?.length ?? 0;
        failed += rejected;
        sent += chunk.length - rejected;
        if (rejected) console.error(`Newsletter batch: ${rejected} addresses rejected`);
      }
    } catch (error) {
      failed += chunk.length;
      console.error("Newsletter batch threw:", error);
    }

    // Stay under the API rate limit between batches.
    if (start + SEND_BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { sent, failed };
}

/** One letter to one person, with their real unsubscribe link and headers. */
export async function sendLetterToOne(content: LetterContent, recipient: LetterRecipient) {
  const { page } = unsubscribeLinks(recipient.unsubscribeToken);
  await sendEmail({
    to: recipient.email,
    subject: content.subject,
    html: renderLetter(content, page),
    text: renderLetterText(content, page),
    headers: unsubscribeHeaders(recipient.unsubscribeToken),
    replyTo: REPLY_TO,
  });
}

/** The first letter, sent right after the double opt-in. Delivers the promised checklist. */
export function welcomeLetter(): LetterContent {
  return {
    subject: "You're in. Here's the checklist I promised",
    preheader: "24 checks to run before a web app meets real users.",
    note: "Thanks for confirming. You're on the list.\n\nHere is how this works: when a new article goes live, you get one short email with the link and a line on who it's for. No schedule I have to hit, no filler.\n\nAnd here's the checklist I promised. Print it, or keep it open next to your editor and tick as you go.\n\nMiloš",
    card: {
      kicker: "Free checklist",
      title: "The Production Checklist",
      excerpt:
        "Twenty-four checks to run before a web app meets real users, each one linked to the article that explains the why and shows the code.",
      url: `${SITE_URL()}/production-checklist`,
      cta: "Open the checklist",
    },
  };
}

/** Deletes sign-ups nobody confirmed. Their consent window closed long ago. */
export async function purgeExpiredPending(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - PENDING_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.newsletterSubscriber.deleteMany({
    where: { confirmed: false, updatedAt: { lt: cutoff } },
  });
  return count;
}

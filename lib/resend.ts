import { Resend } from "resend";

/**
 * Lazy singletons. Constructing the Resend client at module scope makes
 * `next build` require RESEND_API_KEY (page-data collection evaluates every
 * route module), so a missing env var breaks the whole build instead of the
 * one send that actually needs it. Resolve on first use and fail with a
 * descriptive error at send time instead.
 */
let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY is not set — email sending is disabled until it is configured.");
    }
    client = new Resend(key);
  }
  return client;
}

export function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set — configure the verified sender address (e.g. \"CodeFromScratch <hello@codefromscratch.org>\").");
  }
  return from;
}

import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import type { MailboxConfig } from "./config";
import type { Address } from "./conversations";

export type OutgoingReply = {
  to: Address;
  subject: string;
  text: string;
  inReplyTo: string | null;
  references: string[];
};

/**
 * Sends a reply from the office mailbox over its own SMTP server, so it
 * leaves from the real address with the provider's SPF and DKIM, exactly as
 * if it had been sent from a mail program. Returns the raw message so the
 * caller can file a copy in Sent.
 */
export async function sendReply(config: MailboxConfig, reply: OutgoingReply): Promise<{ messageId: string; raw: Buffer }> {
  const domain = config.user.split("@")[1] ?? "codefromscratch.org";
  const messageId = `<${randomUUID()}@${domain}>`;
  const raw = await new MailComposer({
    from: { name: config.fromName, address: config.user },
    to: { name: reply.to.name, address: reply.to.address },
    subject: reply.subject,
    text: reply.text,
    messageId,
    date: new Date(),
    ...(reply.inReplyTo ? { inReplyTo: reply.inReplyTo } : {}),
    ...(reply.references.length ? { references: reply.references } : {}),
  })
    .compile()
    .build();

  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });
  try {
    await transport.sendMail({ envelope: { from: config.user, to: [reply.to.address] }, raw });
  } finally {
    transport.close();
  }
  return { messageId, raw };
}

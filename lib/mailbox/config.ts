/**
 * The office mailbox the contacts inbox reads and sends from (Namecheap
 * Private Email). The password is an app password made for this purpose in
 * Private Email, set only in the Vercel environment, never in the repository.
 * Without MAILBOX_USER and MAILBOX_PASSWORD the inbox shows the form
 * messages alone and replies go through the operator's mail program.
 */
export type MailboxConfig = {
  user: string;
  password: string;
  imap: { host: string; port: number; secure: boolean };
  smtp: { host: string; port: number; secure: boolean };
  fromName: string;
  /** Private Email does not file mail sent over SMTP; the inbox puts a copy in Sent itself. */
  saveSent: boolean;
};

const LOCAL = new Set(["localhost", "127.0.0.1", "::1"]);

export function mailboxConfig(env: Record<string, string | undefined> = process.env): MailboxConfig | null {
  const user = env.MAILBOX_USER?.trim();
  const password = env.MAILBOX_PASSWORD;
  if (!user || !password) return null;
  const imapHost = env.MAILBOX_IMAP_HOST?.trim() || "mail.privateemail.com";
  const smtpHost = env.MAILBOX_SMTP_HOST?.trim() || "mail.privateemail.com";
  // Plain connections exist only for the local test servers; a real host always gets TLS.
  const plain = env.MAILBOX_TLS === "off" && LOCAL.has(imapHost) && LOCAL.has(smtpHost);
  return {
    user,
    password,
    imap: { host: imapHost, port: Number(env.MAILBOX_IMAP_PORT) || 993, secure: !plain },
    smtp: { host: smtpHost, port: Number(env.MAILBOX_SMTP_PORT) || 465, secure: !plain },
    fromName: env.MAILBOX_FROM_NAME?.trim() || "CodeFromScratch",
    saveSent: env.MAILBOX_SAVE_SENT !== "off",
  };
}

/** Addresses that are us: the mailbox itself and the site's sending address. */
export function selfAddresses(config: MailboxConfig | null, env: Record<string, string | undefined> = process.env): Set<string> {
  const self = new Set<string>(["office@codefromscratch.org"]);
  if (config) self.add(config.user.toLowerCase());
  const from = /<([^>]+)>/.exec(env.EMAIL_FROM ?? "")?.[1] ?? env.EMAIL_FROM;
  if (from && from.includes("@")) self.add(from.trim().toLowerCase());
  return self;
}

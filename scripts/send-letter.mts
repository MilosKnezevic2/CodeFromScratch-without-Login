/**
 * Sends one newsletter letter through the same service the portal uses, for
 * sends the operator approves in chat (the portal needs a browser login).
 *
 *   npx tsx scripts/send-letter.mts --post <slug> --subject "..." [--preheader "..."] [--note-file path]
 *     (dry run: prints the plain-text letter and the recipient count, sends nothing)
 *   ... --test you@example.com          (one test email; a subscribed address gets its real unsubscribe link)
 *   ... --apply --confirm <count>       (sends to every confirmed subscriber; the count must match)
 *
 * The guards are the portal's: the confirmed count must be typed back, a
 * letter with the same subject within 24 hours is refused, a running send
 * blocks another, and the campaign row records the result.
 */
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
    if (m) process.env[m[1]] ??= m[2].replace(/^"|"$/g, "");
  }
}

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const APPLY = args.includes("--apply");

const SEND_LOCK_MS = 15 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const [{ parseLetterInput, isValidEmail }, service, { prisma }, letter, { sendEmail }] = await Promise.all([
  import("@/lib/newsletter/input"),
  import("@/lib/newsletter/service"),
  import("@/lib/prisma"),
  import("@/lib/emails/newsletter-letter"),
  import("@/lib/send-email"),
]);

const noteFile = flag("--note-file");
const parsed = parseLetterInput({
  subject: flag("--subject") ?? "",
  preheader: flag("--preheader") ?? "",
  note: noteFile ? readFileSync(noteFile, "utf8") : "",
  postSlug: flag("--post") ?? "",
});
if (!parsed.ok) {
  console.error(parsed.error);
  process.exit(1);
}
const content = await service.buildLetterContent(parsed.value);
if (!content) {
  console.error("That article does not exist.");
  process.exit(1);
}

const recipients = await prisma.newsletterSubscriber.findMany({
  where: { confirmed: true },
  select: { email: true, unsubscribeToken: true },
});
const { from, replyTo, identity } = await service.letterSender();

// Links and the unsubscribe address go into the email: a real send needs the public address.
if ((flag("--test") || APPLY) && !/^https:\/\//.test(letter.SITE_URL())) {
  console.error(`NEXT_PUBLIC_SITE_URL is ${letter.SITE_URL()}; set it to the public https address for a real send.`);
  process.exit(1);
}

const test = flag("--test");
if (test) {
  if (!isValidEmail(test)) {
    console.error("Enter a valid test address.");
    process.exit(1);
  }
  const testContent = { ...content, subject: `[TEST] ${content.subject}` };
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { email: test.toLowerCase() } });
  if (subscriber?.confirmed) {
    await service.sendLetterToOne(testContent, { email: subscriber.email, unsubscribeToken: subscriber.unsubscribeToken });
  } else {
    const placeholder = `${letter.SITE_URL()}/newsletter`;
    await sendEmail({
      to: test,
      subject: testContent.subject,
      html: letter.renderLetter(testContent, placeholder, identity),
      text: letter.renderLetterText(testContent, placeholder, identity),
      replyTo,
    });
  }
  console.log(`test sent to ${test} (from ${from})`);
  await prisma.$disconnect();
  process.exit(0);
}

if (!APPLY) {
  console.log(`DRY RUN — from: ${from} — reply-to: ${replyTo} — ${recipients.length} confirmed recipient(s)\n`);
  console.log(letter.renderLetterText(content, `${letter.SITE_URL()}/newsletter/unsubscribe?token=...`, identity));
  await prisma.$disconnect();
  process.exit(0);
}

const confirm = Number(flag("--confirm"));
if (recipients.length === 0) {
  console.error("There are no confirmed subscribers.");
  process.exit(1);
}
if (confirm !== recipients.length) {
  console.error(`The list has ${recipients.length} confirmed subscribers, not ${String(flag("--confirm"))}.`);
  process.exit(1);
}
const now = Date.now();
if (await prisma.newsletterCampaign.findFirst({ where: { status: "SENDING", createdAt: { gt: new Date(now - SEND_LOCK_MS) } }, select: { id: true } })) {
  console.error("Another letter is being sent right now.");
  process.exit(1);
}
if (
  await prisma.newsletterCampaign.findFirst({
    where: { subject: content.subject, status: { in: ["SENT", "PARTIAL"] }, createdAt: { gt: new Date(now - DUPLICATE_WINDOW_MS) } },
    select: { id: true },
  })
) {
  console.error("A letter with this subject already went out in the last 24 hours.");
  process.exit(1);
}

const campaign = await prisma.newsletterCampaign.create({
  data: {
    subject: content.subject,
    preheader: content.preheader ?? null,
    note: content.note ?? null,
    postSlug: parsed.value.postSlug || null,
    htmlBody: letter.renderLetter(content, `${letter.SITE_URL()}/newsletter`, identity),
    status: "SENDING",
    recipientCount: recipients.length,
  },
});
const { sent, failed } = await service.sendLetterToRecipients(content, recipients, campaign.id);
const status = failed === 0 ? "SENT" : sent === 0 ? "FAILED" : "PARTIAL";
await prisma.newsletterCampaign.update({
  where: { id: campaign.id },
  data: { status, sentCount: sent, failedCount: failed, sentAt: new Date() },
});
console.log(`${status}: sent ${sent}, failed ${failed} (campaign ${campaign.id})`);
await prisma.$disconnect();

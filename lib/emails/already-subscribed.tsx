import { renderNotice } from "@/lib/emails/newsletter-letter";

interface AlreadySubscribedEmailProps {
  /** What the address is already signed up for, e.g. "the newsletter". */
  what: string;
  unsubscribeUrl: string;
}

/**
 * Sent when someone submits an address that is already confirmed. The page
 * answers every address with the same message (no list-membership probe), so
 * this email is how a real owner learns that nothing more is needed. It also
 * doubles as the way to leave without an old email at hand.
 */
export function AlreadySubscribedEmail({ what, unsubscribeUrl }: AlreadySubscribedEmailProps) {
  return renderNotice({
    title: "You are already on the list",
    paragraphs: [
      `Someone entered this email address on codefromscratch.org to join ${what}. It is already on the list, so there is nothing to confirm and nothing more to do.`,
    ],
    action: { label: "Unsubscribe", url: unsubscribeUrl },
    footnote: "Only press the button if you want to leave. If this was not you, you can ignore this message.",
  });
}

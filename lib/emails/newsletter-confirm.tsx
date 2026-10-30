import { renderNotice } from "@/lib/emails/newsletter-letter";

interface NewsletterConfirmEmailProps {
  confirmUrl: string;
}

export function NewsletterConfirmEmail({ confirmUrl }: NewsletterConfirmEmailProps) {
  return renderNotice({
    title: "Confirm your subscription",
    paragraphs: [
      "Someone entered this email address on codefromscratch.org to receive its newsletter. Press the button to confirm it was you.",
    ],
    action: { label: "Confirm my subscription", url: confirmUrl },
    footnote: "If this was not you, ignore this message and nothing will happen. You will not be added to the list.",
  });
}

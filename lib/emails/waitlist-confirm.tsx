import { renderNotice } from "@/lib/emails/newsletter-letter";

interface WaitlistConfirmEmailProps {
  confirmUrl: string;
  unsubscribeUrl: string;
}

export function WaitlistConfirmEmail({ confirmUrl, unsubscribeUrl }: WaitlistConfirmEmailProps) {
  return renderNotice({
    title: "Confirm your place on the waitlist",
    paragraphs: [
      "Someone entered this email address on codefromscratch.org to be told when the course opens. Press the button to confirm it was you.",
    ],
    action: { label: "Confirm my place", url: confirmUrl },
    footnote: `If this was not you, ignore this message and nothing will happen. To remove your address at any time, use this link: ${unsubscribeUrl}`,
  });
}

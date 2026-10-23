interface NewsletterConfirmEmailProps {
  confirmUrl: string;
}

export function NewsletterConfirmEmail({ confirmUrl }: NewsletterConfirmEmailProps) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <p>Someone entered this email address on codefromscratch.org to receive its newsletter. To confirm, open this link:</p>
      <p><a href="${confirmUrl}">${confirmUrl}</a></p>
      <p style="margin-top:24px;color:#666;font-size:14px;">If this was not you, ignore this message and nothing will happen. You will not be added to the list.</p>
      <p style="margin-top:24px;color:#666;font-size:12px;">CodeFromScratch · Milos Knezevic · Graz, Austria · office@codefromscratch.org</p>
    </div>
  `;
}

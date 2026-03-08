interface NewsletterConfirmEmailProps {
  confirmUrl: string;
}

export function NewsletterConfirmEmail({ confirmUrl }: NewsletterConfirmEmailProps) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Confirm your newsletter subscription</h2>
      <p>Thanks for subscribing to CodeFromScratch Blog!</p>
      <p>Please confirm your subscription by clicking the button below:</p>
      <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:500;">
        Confirm Subscription
      </a>
      <p style="margin-top:24px;color:#666;font-size:14px;">If you didn't subscribe, you can safely ignore this email.</p>
    </div>
  `;
}

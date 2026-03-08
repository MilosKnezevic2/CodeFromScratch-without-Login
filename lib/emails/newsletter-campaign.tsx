interface NewsletterCampaignEmailProps {
  htmlBody: string;
  unsubscribeUrl: string;
}

export function NewsletterCampaignEmail({
  htmlBody,
  unsubscribeUrl,
}: NewsletterCampaignEmailProps) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      ${htmlBody}
      <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0;" />
      <p style="color:#94a3b8;font-size:12px;">
        You received this email because you subscribed to CodeFromScratch Blog newsletter.
        <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a>
      </p>
    </div>
  `;
}

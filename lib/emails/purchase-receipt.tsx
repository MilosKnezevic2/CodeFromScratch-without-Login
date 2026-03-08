interface PurchaseReceiptEmailProps {
  name: string;
  ebookTitle: string;
  amount: string;
  downloadUrl: string;
}

export function PurchaseReceiptEmail({
  name,
  ebookTitle,
  amount,
  downloadUrl,
}: PurchaseReceiptEmailProps) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Purchase Receipt</h2>
      <p>Hi ${name},</p>
      <p>Thank you for your purchase!</p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-weight:600;">${ebookTitle}</p>
        <p style="margin:4px 0 0;color:#666;">${amount}</p>
      </div>
      <a href="${downloadUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:500;">
        Download Ebook
      </a>
    </div>
  `;
}

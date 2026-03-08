interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Welcome to CodeFromScratch Blog!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created successfully. You now have access to:</p>
      <ul>
        <li>Save and organize your favorite posts</li>
        <li>Subscribe to our newsletter</li>
        <li>Purchase ebooks</li>
      </ul>
      <p>Upgrade to Pro to unlock premium articles and free ebooks.</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:500;">
        Go to Dashboard
      </a>
    </div>
  `;
}

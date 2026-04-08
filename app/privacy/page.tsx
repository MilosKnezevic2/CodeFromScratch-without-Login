import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CodeFromScratch collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: April 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-lg font-bold text-foreground">1. Who We Are</h2>
          <p className="mt-2">
            CodeFromScratch is operated by Milos Knezevic, based in Graz, Austria. Contact: office@codefromscratch.org.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">2. What Data We Collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Account data:</strong> Name, email address, password (hashed), profile image (via OAuth)</li>
            <li><strong>Usage data:</strong> Reading history, saved posts, collections, topic interests, post reactions</li>
            <li><strong>Payment data:</strong> Processed by Stripe. We store your Stripe customer ID but never see your card details.</li>
            <li><strong>Newsletter:</strong> Email address, subscription preferences, confirmation status</li>
            <li><strong>Contact form:</strong> Name, email, subject, message</li>
            <li><strong>Technical data:</strong> IP address (hashed for anonymous reactions), browser type, device info (via analytics)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">3. How We Use Your Data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Provide and improve our services (personalized recommendations, reading history)</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send newsletters and transactional emails (account verification, password reset, purchase receipts)</li>
            <li>Respond to contact form inquiries</li>
            <li>Analyze site usage to improve content and user experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">4. Third-Party Services</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Stripe</strong> — Payment processing (<a href="https://stripe.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>)</li>
            <li><strong>Supabase</strong> — Database hosting (PostgreSQL)</li>
            <li><strong>Sanity</strong> — Content management system</li>
            <li><strong>Resend</strong> — Email delivery service</li>
            <li><strong>Plausible Analytics</strong> — Privacy-friendly analytics (no cookies, GDPR compliant)</li>
            <li><strong>Vercel</strong> — Hosting and deployment</li>
            <li><strong>Google / GitHub</strong> — OAuth login (optional, user-initiated)</li>
          </ul>
        </section>

        <section id="cookies">
          <h2 className="text-lg font-bold text-foreground">5. Cookies</h2>
          <p className="mt-2">
            We use minimal cookies required for authentication (session tokens). Our analytics provider (Plausible) does not use cookies. We do not use tracking cookies or advertising cookies.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>authjs.session-token</strong> — Authentication session (essential, httpOnly)</li>
            <li><strong>cfs-admin-token</strong> — Admin authentication (essential, httpOnly)</li>
            <li><strong>cookie-consent</strong> — Your cookie preference (localStorage)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">6. Your Rights (GDPR)</h2>
          <p className="mt-2">If you are in the EU/EEA, you have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Export your data (data portability)</li>
            <li>Withdraw consent for data processing</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us at <a href="mailto:office@codefromscratch.org" className="text-accent hover:underline">office@codefromscratch.org</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">7. Data Retention</h2>
          <p className="mt-2">
            We retain your data for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where retention is required by law (e.g., financial records for tax purposes).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">8. Data Security</h2>
          <p className="mt-2">
            We protect your data with encryption (HTTPS/TLS), hashed passwords (bcrypt), secure session management, and access controls. Payment data is handled exclusively by Stripe (PCI DSS compliant).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">9. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this policy from time to time. Significant changes will be communicated via email or a notice on our website.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">10. Contact</h2>
          <p className="mt-2">
            For questions about this policy or your data, email <a href="mailto:office@codefromscratch.org" className="text-accent hover:underline">office@codefromscratch.org</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

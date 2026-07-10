import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using CodeFromScratch.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: April 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using CodeFromScratch (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">2. Accounts</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account and password.</li>
            <li>You must be at least 16 years old to create an account.</li>
            <li>One person per account. Shared accounts are not permitted.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">3. Subscriptions & Payments</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Paid plans (Pro, Pro+) are billed monthly or annually through Stripe.</li>
            <li>You can cancel your subscription at any time. Access continues until the end of the billing period.</li>
            <li>We offer a 30-day money-back guarantee. Contact us within 30 days for a full refund.</li>
            <li>Prices may change with 30 days&apos; notice. Existing subscribers keep their current price until renewal.</li>
            <li>Ebooks are one-time purchases. Digital products are non-refundable after download.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">4. Content & Intellectual Property</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>All content on CodeFromScratch (articles, ebooks, courses, code examples) is owned by CodeFromScratch unless otherwise stated.</li>
            <li>You may use code examples from articles in your own projects (personal and commercial).</li>
            <li>You may not redistribute, resell, or republish our articles, ebooks, or courses.</li>
            <li>Sharing short excerpts with attribution is permitted.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">5. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Use the Service for any illegal purpose.</li>
            <li>Attempt to gain unauthorized access to other accounts or systems.</li>
            <li>Scrape, crawl, or automated-access the Service without permission.</li>
            <li>Share your account credentials with others.</li>
            <li>Post spam, abusive, or harmful content in comments or forms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">6. Limitation of Liability</h2>
          <p className="mt-2">
            The Service is provided &quot;as is&quot; without warranties of any kind. CodeFromScratch is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you paid us in the 12 months before the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">7. Governing Law</h2>
          <p className="mt-2">
            These terms are governed by the laws of Austria. Any disputes shall be resolved in the courts of Graz, Austria.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">8. Changes to Terms</h2>
          <p className="mt-2">
            We may update these terms. Continued use of the Service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">9. Contact</h2>
          <p className="mt-2">
            Questions? Email <a href="mailto:office@codefromscratch.org" className="text-accent hover:underline">office@codefromscratch.org</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

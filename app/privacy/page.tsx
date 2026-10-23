import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal data CodeFromScratch processes, why, and what rights you have.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const LINK = "text-accent underline underline-offset-2";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-lg font-bold text-foreground">1. Who is responsible</h2>
          <p className="mt-2">
            CodeFromScratch is a non-commercial learning blog run by Milos Knezevic, Graz, Austria. Contact:{" "}
            <a href="mailto:office@codefromscratch.org" className={LINK}>office@codefromscratch.org</a>.
          </p>
          <p className="mt-2">
            The site has no user accounts, no payments and no advertising. It sets no cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">2. What data we process, why, and on what basis</h2>
          <ul className="mt-2 list-disc space-y-3 pl-5">
            <li>
              <strong>Visiting the site.</strong> Our hosting provider (Vercel) processes technical request data, such
              as your IP address and the page you request, to deliver the site and keep it secure. Legal basis: our
              legitimate interest in running a secure website (Art. 6(1)(f) GDPR).
            </li>
            <li>
              <strong>Anonymous statistics.</strong> We use Vercel Web Analytics and Vercel Speed Insights to see which
              pages are read and how fast they load. According to Vercel, Web Analytics uses no third-party cookies and
              identifies a visit by a hash of the request that is discarded after 24 hours. It records the page,
              referrer, country, browser, operating system and device type. Speed Insights records performance
              measurements for a page, plus country, browser and device type. Legal basis: our legitimate interest in
              improving the site (Art. 6(1)(f) GDPR). Details:{" "}
              <a href="https://vercel.com/docs/analytics/privacy-policy" className={LINK} target="_blank" rel="noopener noreferrer">Vercel Web Analytics privacy</a>{" "}
              and{" "}
              <a href="https://vercel.com/docs/speed-insights/privacy-policy" className={LINK} target="_blank" rel="noopener noreferrer">Speed Insights privacy</a>.
            </li>
            <li>
              <strong>Newsletter.</strong> If you subscribe, we store your email address, a confirmation token and your
              subscription status. We first send one confirmation email and only add you to the list after you click the
              link (double opt-in). Legal basis: your consent (Art. 6(1)(a) GDPR). You can withdraw it at any time with
              the unsubscribe link in every email; unsubscribing deletes your address from our list.
            </li>
            <li>
              <strong>Contact form.</strong> If you write to us, we store your name, email address, subject and message
              so we can answer you. Legal basis: our legitimate interest in answering enquiries (Art. 6(1)(f) GDPR), or
              taking steps at your request. We keep the message only as long as it is needed to handle your request.
            </li>
          </ul>
        </section>

        <section id="cookies">
          <h2 className="text-lg font-bold text-foreground">3. Cookies and local storage</h2>
          <p className="mt-2">
            The public pages of this site set no cookies. Your browser stores your theme (light or dark) and text-size
            choice in its local storage; this stays on your device and is never sent to us. Only the site
            administrator has a login cookie, in a separate area that visitors do not use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">4. Service providers who process data for us</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Vercel</strong>: hosting, anonymous analytics and performance measurement</li>
            <li><strong>Supabase</strong>: database for newsletter subscribers and contact messages</li>
            <li><strong>Resend</strong>: sending the confirmation and newsletter emails</li>
            <li><strong>Sanity</strong>: content management for the articles (it holds our articles, not visitor data)</li>
          </ul>
          <p className="mt-2">
            Some of these providers are based in, or process data in, the United States. They describe how they protect
            transferred data in their own privacy documentation, which you can read on their websites.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">5. Your rights</h2>
          <p className="mt-2">Under the GDPR you have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>access the data we hold about you</li>
            <li>have inaccurate data corrected and have your data erased</li>
            <li>restrict how we process your data and receive it in a portable format</li>
            <li>object to processing that rests on our legitimate interest</li>
            <li>withdraw a consent at any time, without affecting what happened before</li>
          </ul>
          <p className="mt-2">
            To use any of these rights, email{" "}
            <a href="mailto:office@codefromscratch.org" className={LINK}>office@codefromscratch.org</a>. You also have
            the right to complain to the Austrian data protection authority (Datenschutzbehörde,{" "}
            <a href="https://www.dsb.gv.at" className={LINK} target="_blank" rel="noopener noreferrer">dsb.gv.at</a>).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">6. Security</h2>
          <p className="mt-2">
            The site is served over HTTPS and access to the database and administration area is limited to the site
            owner.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">7. Changes</h2>
          <p className="mt-2">
            If we add a feature that processes more data, for example accounts or paid products, we will update this
            policy before it goes live. The date at the top shows the latest version.
          </p>
        </section>
      </div>
    </div>
  );
}

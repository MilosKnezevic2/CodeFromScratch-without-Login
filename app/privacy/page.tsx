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
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 30 October 2026</p>

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
              <strong>Our own visit counts.</strong> We also keep simple daily totals in our database: how often each
              page was viewed, how often a page stayed open for 30 seconds, how often an article was read halfway and to
              the end, the total time spent on a page, and how many sign-ups and shares started from it. For a visit
              that arrives from outside the site, we add one to separate daily totals for the website it came from, the
              country and the device type (mobile, tablet or desktop). We also count confirmed sign-ups and unsubscribes
              as plain daily numbers. We store no cookie, no identifier and no IP address, and nothing is written to your
              device, so we cannot recognise you or connect two visits. Your IP address is used briefly, in memory, to
              limit abusive requests, and our hosting provider uses it to work out the country. If your browser sends a
              Global Privacy Control or Do Not Track signal, these counts are not sent. Legal basis: our legitimate
              interest in knowing which articles are useful (Art. 6(1)(f) GDPR).
            </li>
            <li>
              <strong>Newsletter.</strong> If you subscribe, we store your email address, a confirmation token, your
              subscription status, and the dates you signed up and confirmed (our proof of your consent). We first send
              one confirmation email and only add you to the list after you click the link (double opt-in). Sign-ups
              that are never confirmed are deleted after 30 days. After you confirm, you get one welcome email with the
              free checklist, then one short email when a new article is published. We do not track whether you open
              these emails or click their links. Legal basis: your consent (Art. 6(1)(a) GDPR). You can withdraw it at
              any time with the unsubscribe link in every email, or by entering your address on the newsletter page
              again, which sends you a link to leave. Unsubscribing deletes your address from our list.
            </li>
            <li>
              <strong>Course waitlist.</strong> If you join the waitlist for a possible future course, we store your
              email address, the level you pick (beginner, intermediate or advanced), an optional free-text note about
              what you want to learn, a confirmation token and the confirmation status. We send one confirmation email
              and add you only after you click the link (double opt-in). We use the data only to email you once when
              the course opens and to decide what to build first. Legal basis: your consent (Art. 6(1)(a) GDPR). The
              waitlist is separate from the newsletter: joining it does not subscribe you to the newsletter. You can
              withdraw at any time with the link in the confirmation email; doing so deletes your entry completely.
              The same service providers as for the newsletter (Supabase, Resend) process this data.
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
            administrator has a login cookie, in a separate area that visitors do not use, and a local-storage marker
            that keeps their own visits out of the counts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">4. Service providers who process data for us</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Vercel</strong>: hosting, anonymous analytics and performance measurement</li>
            <li><strong>Supabase</strong>: database for newsletter subscribers, contact messages and the daily visit totals</li>
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

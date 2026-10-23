import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using the CodeFromScratch website and its content.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-lg font-bold text-foreground">1. What this site is</h2>
          <p className="mt-2">
            CodeFromScratch is a free, non-commercial learning blog about web development. Reading it needs no account
            and costs nothing. Nothing on this site is for sale at the moment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">2. Using the content</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>You may read, share links to and quote short excerpts of the articles, with attribution and a link back.</li>
            <li>You may use the code examples in your own projects, personal or commercial.</li>
            <li>You may not copy, republish or resell whole articles without written permission.</li>
            <li>Automated copying of the site at scale is not permitted.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">3. No guarantee</h2>
          <p className="mt-2">
            The articles are written to teach and are checked with care, but technology changes quickly and mistakes
            happen. The content is provided for information and education, without any guarantee that it fits your
            particular project. Test code before you rely on it, especially in production.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">4. External links</h2>
          <p className="mt-2">
            We link to other websites. We do not control them and are not responsible for their content. If a link
            earns us money, we say so next to it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">5. Liability</h2>
          <p className="mt-2">
            We are liable as far as the law requires. Nothing in these terms limits liability that cannot be limited
            under applicable law, including your statutory rights as a consumer.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">6. Applicable law</h2>
          <p className="mt-2">
            Austrian law applies. Mandatory consumer protection rules of the country where you live remain unaffected.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">7. Changes and contact</h2>
          <p className="mt-2">
            We may update these terms, and the date above shows the latest version. If we ever start selling products,
            separate terms for them will be published before the first sale. Questions:{" "}
            <a href="mailto:office@codefromscratch.org" className="text-accent underline underline-offset-2">office@codefromscratch.org</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

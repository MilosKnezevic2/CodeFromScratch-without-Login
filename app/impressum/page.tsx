import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Legal information about CodeFromScratch as required by Austrian law.",
  alternates: { canonical: `${SITE_URL}/impressum` },
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground">Impressum</h1>
      <p className="mt-2 text-sm text-muted-foreground">Information according to Austrian E-Commerce Act (ECG)</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-lg font-bold text-foreground">Service Provider</h2>
          <div className="mt-2 space-y-1">
            <p>Milos Knezevic</p>
            <p>Graz, Austria</p>
            <p>
              Email: <a href="mailto:office@codefromscratch.org" className="text-accent hover:underline">office@codefromscratch.org</a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">Purpose</h2>
          <p className="mt-2">
            CodeFromScratch is an educational platform for web development, offering blog articles, ebooks, and courses.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">Applicable Law</h2>
          <p className="mt-2">Austrian law applies. Place of jurisdiction: Graz, Austria.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">Disclaimer</h2>
          <p className="mt-2">
            Despite careful content control, we assume no liability for the content of external links. The operators of linked pages are solely responsible for their content. All content on this website is provided for informational and educational purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">Copyright</h2>
          <p className="mt-2">
            All content, design, and code on this website is protected by copyright. Reproduction or use requires written permission from the operator, except for code examples provided in tutorials which may be used freely.
          </p>
        </section>
      </div>
    </div>
  );
}

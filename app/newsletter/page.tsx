import type { Metadata } from "next";
import Link from "next/link";
import InlineNewsletterCard from "@/components/blog/InlineNewsletterCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const metadata: Metadata = {
  title: "The CodeFromScratch Letter",
  description:
    "One short email when a new article is published. Free, no spam, unsubscribe in one click.",
  alternates: { canonical: `${SITE_URL}/newsletter` },
};

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
        The CodeFromScratch Letter
      </h1>
      <p className="post-standfirst mt-5 max-w-2xl">
        One short email whenever a new article goes live. No schedule I have to
        hit, no filler, nothing you could not skim in a minute.
      </p>

      <ul className="mt-8 max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
        <li>The new article, with one line on who it is for.</li>
        <li>
          A free copy of{" "}
          <Link href="/production-checklist" className="text-accent underline underline-offset-2">
            The Production Checklist
          </Link>
          , available to everyone, subscribed or not.
        </li>
        <li>Your address is used for this letter only, and you can leave in one click.</li>
      </ul>

      <div className="mt-12">
        <InlineNewsletterCard />
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        We use double opt-in: you get one email with a confirmation link, and
        nothing else until you click it. Details are in the{" "}
        <Link href="/privacy" className="text-accent underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}

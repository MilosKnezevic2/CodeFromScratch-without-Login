import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import WriteForUsForm from "@/components/write-for-us/WriteForUsForm";
import { withPageUrl } from "@/lib/seo";

const METADATA: Metadata = {
  title: "Write for us",
  description:
    "Explain one part of web development well enough to teach it? Pitch an article for CodeFromScratch and we write it together, under your name.",
};

export async function generateMetadata(_props: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return withPageUrl("/write-for-us", METADATA, parent);
}

const STEPS = [
  { title: "You pitch", text: "One topic, one reader, one result. A few sentences in the form below are enough." },
  { title: "I answer", text: "I read every pitch myself and reply by email. If it fits, we agree on the outline and the details before you write a word." },
  { title: "We edit together", text: "You write the draft. We go through it together until every code sample runs and every step makes sense to a beginner." },
  { title: "It goes out under your name", text: "Published with your name, photo, a short bio and your links, and announced to the newsletter like every article." },
];

const RULES = [
  { title: "AI help", text: "Fine for research and code. You run every code sample yourself, check every claim and write the text in your own words. You are responsible for its accuracy." },
  { title: "Rights", text: "You keep the copyright. The article appears here first, and we may host and edit it permanently. After 30 days you may republish it elsewhere with a link back to the original." },
  { title: "Figures", text: "Welcome if they are your own: source files at least 1200 px wide, each with a one-line description." },
  { title: "Your author box", text: "Your name, photo, a two-line bio and one link to your site or profile." },
  { title: "Drafts only", text: "You write the article as a draft. Only I publish it, after my review and our edits. Writers have no access to anything else on the site: no database, no reader data, no settings." },
];

const FITS = [
  "One concept explained from scratch: why it exists, how it works, how to use it",
  "Code you have run yourself, explained line by line",
  "Pitfalls you actually hit, and how you got out of them",
  "Written for beginners, with depth for people further along",
];

const DOES_NOT_FIT = [
  "Sponsored posts, paid links or product placements",
  "Articles already published somewhere else",
  "List posts (\"10 tools you need\") and news round-ups",
  "Anything with code you have not run",
];

/** /write-for-us: the pitch page for guest authors. */
export default function WriteForUsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-16 sm:px-6 sm:pt-20 lg:px-8">
      <p className="editorial-meta text-muted-foreground">Write for us</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
        Write an article with me
      </h1>
      <p className="post-standfirst mt-6">
        Until now I have written every article here myself. I would like that to change. If you understand one part of
        web development well enough to teach it, pitch it below, and we will turn it into an article together.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted">
        You do not need to be a senior developer. Sometimes the best explanation comes from someone who figured the
        thing out last month and still remembers what was confusing about it.
      </p>

      <section aria-labelledby="how-h" className="mt-14">
        <h2 id="how-h" className="text-2xl font-extrabold tracking-tight text-foreground">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-mono text-xs font-bold text-accent">0{i + 1}</p>
              <p className="mt-2 font-bold text-foreground">{step.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <p className="font-bold text-foreground">Is it paid?</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Not for now: writing here is unpaid. What you get is your name on the article, an author profile with your
            photo and links, careful editing of your piece, and the readers of the journal and its newsletter. If that
            changes, this page will say so first.
          </p>
        </div>
      </section>

      <section aria-labelledby="fit-h" className="mt-14 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 id="fit-h" className="text-lg font-bold text-foreground">
            What fits the journal
          </h2>
          <ul className="mt-3 space-y-2.5">
            {FITS.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                <span aria-hidden="true" className="mt-0.5 font-bold text-accent">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">What does not</h2>
          <ul className="mt-3 space-y-2.5">
            {DOES_NOT_FIT.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                <span aria-hidden="true" className="mt-0.5 font-bold text-muted-foreground">
                  ×
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="rules-h" className="mt-14">
        <h2 id="rules-h" className="text-2xl font-extrabold tracking-tight text-foreground">
          The rules
        </h2>
        <dl className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
          {RULES.map((rule) => (
            <div key={rule.title} className="grid gap-1 p-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="font-bold text-foreground">{rule.title}</dt>
              <dd className="text-sm leading-relaxed text-muted">{rule.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-sm leading-relaxed text-muted">
        Not sure what the articles here look like?{" "}
        <Link href="/blog" className="font-semibold text-accent underline underline-offset-2">
          Read a few in the journal
        </Link>{" "}
        before you pitch.
      </p>

      <section aria-labelledby="pitch-h" className="mt-14 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-10">
        <h2 id="pitch-h" className="text-2xl font-extrabold tracking-tight text-foreground">
          Send your pitch
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Every field except the links is needed. Your details are used only to talk about this article with you; see
          the{" "}
          <Link href="/privacy" className="text-accent underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
        <div className="mt-8">
          <WriteForUsForm />
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const metadata: Metadata = {
  title: "The Production Checklist: 24 Checks Before You Ship",
  description:
    "A free, printable checklist for web apps: input validation, errors, rate limits, logging, tests, secrets and deploys. Tick it off before anything goes live.",
  alternates: { canonical: `${SITE_URL}/production-checklist` },
};

interface Item {
  text: string;
  guide?: { label: string; href: string };
}

interface Group {
  title: string;
  intro: string;
  items: Item[];
}

const GROUPS: Group[] = [
  {
    title: "1. Input: never trust what arrives",
    intro: "Everything that crosses your boundary is a stranger until it passes a check.",
    items: [
      {
        text: "Every request body, query string and header you read is validated against a schema on the server.",
        guide: { label: "Zod at trust boundaries", href: "/blog/zod-at-trust-boundaries" },
      },
      { text: "Every text field has a maximum length, so nobody can post a 50 MB name." },
      {
        text: "Form validation runs in the browser for speed and again on the server for safety.",
        guide: { label: "Why you check twice", href: "/blog/login-form-validation-client-and-server" },
      },
      { text: "Database access goes through parameterised queries or an ORM, never string-built SQL." },
    ],
  },
  {
    title: "2. Errors: failure is part of the contract",
    intro: "Decide what happens when things break before they do.",
    items: [
      { text: "Every error response has the same shape, so the client never has to guess." },
      { text: "Users see a clear message; stack traces and internals stay in your logs." },
      {
        text: "A broken component shows a fallback instead of a white screen.",
        guide: { label: "Error boundaries done right", href: "/blog/error-boundaries-done-right" },
      },
      { text: "Every call to another service has a timeout, and you know what happens when it fires." },
    ],
  },
  {
    title: "3. Abuse: rate-limit before you need it",
    intro: "The first bot will find your public form faster than your first real user.",
    items: [
      {
        text: "Login, sign-up, contact and any other public endpoint has a rate limit.",
        guide: { label: "Rate limiting in Next.js", href: "/blog/api-rate-limiting-nextjs" },
      },
      { text: "Forms that send email have a honeypot field or another spam check." },
      { text: "Login attempts are limited per account as well as per IP address." },
      { text: "Incoming webhooks verify the sender's signature before doing anything.",
        guide: { label: "Stripe webhook verification", href: "/blog/stripe-webhook-verification" },
      },
    ],
  },
  {
    title: "4. Visibility: logs you can search at 2 a.m.",
    intro: "If you cannot see it, you cannot fix it.",
    items: [
      {
        text: "Logs are structured (JSON), with a request ID on every line.",
        guide: { label: "Structured logging", href: "/blog/structured-logging-nextjs" },
      },
      { text: "Passwords, tokens and personal data never appear in a log line." },
      {
        text: "Errors are reported somewhere you will actually look, and you get an alert for new ones.",
        guide: { label: "Observability for a solo project", href: "/blog/observability-solo-saas" },
      },
      { text: "A health-check endpoint exists, and something pings it." },
    ],
  },
  {
    title: "5. Tests: protect the paths that matter",
    intro: "You do not need to test everything. You need to test what hurts when it breaks.",
    items: [
      { text: "Login, payments and permission checks have automated tests." },
      { text: "Every bug you fix gets a test that would have caught it." },
      { text: "Tests run on every pull request and a red build blocks the merge." },
      { text: "No test depends on the real internet or on another test running first." },
    ],
  },
  {
    title: "6. Secrets and deploys: the boring part that saves you",
    intro: "Most disasters here are one forgotten line.",
    items: [
      { text: "No secret lives in the code or the git history; .env is in .gitignore from the first commit." },
      { text: "Production secrets differ from development secrets, and you know where each one is set." },
      { text: "Cookies are httpOnly, secure and SameSite; security headers are set and checked." },
      {
        text: "You can roll back the last deploy in under five minutes, and you have tried it once.",
        guide: { label: "Rollback without feature flags", href: "/blog/rollback-without-feature-flags" },
      },
    ],
  },
];

export default function ProductionChecklistPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <p className="editorial-meta text-muted-foreground">Free checklist</p>
      <h1 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
        The Production Checklist
      </h1>
      <p className="post-standfirst mt-5 max-w-2xl">
        Twenty-four checks to run before a web app meets real users. Each group
        links to the article that explains the why and shows the code. Print it,
        or keep it open next to your editor and tick as you go.
      </p>
      <p className="mt-4 text-sm text-muted-foreground no-print">
        Want the next article in your inbox?{" "}
        <Link href="/newsletter" className="text-accent underline underline-offset-2">
          Join the letter
        </Link>
        .
      </p>

      <div className="mt-12 space-y-12">
        {GROUPS.map((group, g) => (
          <section key={group.title} aria-labelledby={`group-${g}`} className="break-inside-avoid">
            <h2 id={`group-${g}`} className="text-xl font-bold text-foreground">
              {group.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{group.intro}</p>
            <ul className="mt-4 space-y-3">
              {group.items.map((item, i) => {
                const id = `check-${g}-${i}`;
                return (
                  <li key={id} className="flex items-start gap-3">
                    <input
                      id={id}
                      type="checkbox"
                      className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                    />
                    <label htmlFor={id} className="text-sm leading-relaxed text-muted">
                      {item.text}
                      {item.guide && (
                        <>
                          {" "}
                          <Link
                            href={item.guide.href}
                            className="whitespace-nowrap text-accent underline underline-offset-2 no-print"
                          >
                            {item.guide.label} →
                          </Link>
                        </>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-14 text-sm leading-relaxed text-muted">
        The long version of all this is{" "}
        <Link
          href="/blog/production-grade-code-checklist"
          className="text-accent underline underline-offset-2"
        >
          Production-Grade Code
        </Link>
        . You can do this. You have to do this, and now you have the list.
      </p>
    </div>
  );
}

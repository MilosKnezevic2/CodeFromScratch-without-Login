"use client";

import { useState } from "react";

export default function InlineNewsletterCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErrorMessage(body?.error ?? "Something went wrong. Try again.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Try again.");
      setStatus("error");
    }
  }

  return (
    <aside
      aria-labelledby="inline-newsletter-heading"
      className="relative overflow-hidden rounded-3xl border border-border/50 bg-foreground/[0.03] px-6 py-12 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:px-10 sm:py-16 lg:px-16 lg:py-20"
    >
      {/* Frosted-glass tint — uses the page's own foreground colour at very
          low opacity so the panel feels embedded in the palette, just
          slightly elevated. A soft accent wash adds warmth without
          shouting "this is a separate panel". */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground/[0.025] via-transparent to-accent/[0.025]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-accent-2/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-5xl items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="editorial-meta text-muted-foreground">Subscription</p>
          <h2
            id="inline-newsletter-heading"
            className="editorial-display mt-4 text-4xl leading-[0.95] text-foreground sm:text-5xl lg:text-6xl"
            style={{ fontStyle: "normal" }}
          >
            Never miss an issue.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            One short letter whenever a new piece ships — the article, what
            I&rsquo;m reading, what I&rsquo;m building. Twenty seconds to
            skim. Unsubscribe in one click.
          </p>
        </div>
        <form onSubmit={onSubmit} className="lg:col-span-5">
          <label
            className="editorial-meta block text-muted-foreground"
            htmlFor="inline-newsletter-email"
          >
            Your email address
          </label>
          <div className="mt-3 flex items-end gap-4 border-b border-border/70 transition-colors focus-within:border-foreground">
            <input
              id="inline-newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={status === "loading" || status === "success"}
              className="flex-1 appearance-none bg-transparent px-0 pb-2 text-lg text-foreground placeholder:text-muted-foreground/60 !outline-none !ring-0 !shadow-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:![outline-offset:0] [&:invalid]:!shadow-none disabled:opacity-60"
              suppressHydrationWarning
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="whitespace-nowrap pb-2 text-sm font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-accent disabled:opacity-60"
              suppressHydrationWarning
            >
              {status === "loading"
                ? "Subscribing…"
                : status === "success"
                  ? "Subscribed ✓"
                  : "Subscribe →"}
            </button>
          </div>
          <p className="editorial-meta mt-4 text-muted-foreground/70">
            No spam, ever · No tracking pixels · Unsubscribe in one click
          </p>
          {status === "success" && (
            <p
              role="status"
              className="mt-3 text-xs font-medium text-emerald-400"
            >
              Check your inbox to confirm — that&rsquo;s the last step.
            </p>
          )}
          {status === "error" && errorMessage && (
            <p role="alert" className="mt-3 text-xs font-medium text-red-400">
              {errorMessage}
            </p>
          )}
        </form>
      </div>
    </aside>
  );
}

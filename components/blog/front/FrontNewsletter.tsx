"use client";

import { useNewsletterSignup } from "../useNewsletterSignup";

/** The front page's one newsletter ask, beside Most read: a concrete reward, one field, one button. */
export default function FrontNewsletter() {
  const { email, setEmail, honeypot, setHoneypot, status, message, submit } = useNewsletterSignup();
  const busy = status === "loading" || status === "success";
  return (
    <section aria-labelledby="front-newsletter-h" className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
      <p className="editorial-meta text-accent">The newsletter</p>
      <h2 id="front-newsletter-h" className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-foreground">
        One email per new tutorial, and the production checklist free
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">24 checks to run before a web app meets real users. Unsubscribe in one click.</p>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        {/* Honeypot: invisible to people; bots fill it and get a fake success. */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <label htmlFor="front-newsletter-email" className="sr-only">
          Your email address
        </label>
        <input
          id="front-newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={busy}
          className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-accent/60 focus:outline-none disabled:opacity-60"
          suppressHydrationWarning
        />
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
          suppressHydrationWarning
        >
          {status === "loading" ? "Subscribing…" : status === "success" ? "Sent ✓" : "Subscribe"}
        </button>
      </form>
      {message && (
        <p role={status === "error" ? "alert" : "status"} className={`mt-3 text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}>
          {message}
        </p>
      )}
    </section>
  );
}

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
      className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-surface to-accent-2/15 p-6 sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/20 blur-3xl"
      />
      <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Newsletter
          </p>
          <h2
            id="inline-newsletter-heading"
            className="mt-2 text-xl font-extrabold leading-tight text-foreground sm:text-2xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            New articles, straight to your inbox
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            One short email per week. Best new tutorials, behind-the-scenes
            notes, no fluff. Unsubscribe in one click.
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="flex w-full max-w-sm flex-col gap-2 sm:max-w-none sm:flex-row sm:items-stretch"
        >
          <label className="sr-only" htmlFor="inline-newsletter-email">
            Email address
          </label>
          <input
            id="inline-newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "loading" || status === "success"}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="whitespace-nowrap rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {status === "loading"
              ? "Subscribing…"
              : status === "success"
                ? "✓ Subscribed"
                : "Subscribe"}
          </button>
        </form>
      </div>
      {status === "success" && (
        <p
          role="status"
          className="relative mt-3 text-xs font-semibold text-green-400"
        >
          Check your inbox to confirm — that&apos;s the last step.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p role="alert" className="relative mt-3 text-xs font-semibold text-red-400">
          {errorMessage}
        </p>
      )}
    </aside>
  );
}

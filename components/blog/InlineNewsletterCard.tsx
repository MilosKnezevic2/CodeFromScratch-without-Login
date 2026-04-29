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
      className="letterpress-block px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
    >
      <div className="mx-auto grid max-w-5xl items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p
            className="editorial-meta"
            style={{ color: "rgba(245,241,232,0.55)" }}
          >
            §05 — Subscription
          </p>
          <h2
            id="inline-newsletter-heading"
            className="editorial-display mt-4 text-4xl leading-[0.95] sm:text-5xl lg:text-6xl"
            style={{ color: "#f5f1e8", fontStyle: "normal" }}
          >
            Read tomorrow&rsquo;s issue{" "}
            <span style={{ fontStyle: "italic" }}>today.</span>
          </h2>
          <p
            className="mt-5 max-w-md text-base leading-relaxed"
            style={{ color: "rgba(245,241,232,0.65)", fontFamily: "var(--font-serif)" }}
          >
            <em>
              One short letter on a Sunday. A new piece of writing, what
              we&rsquo;re reading, what we&rsquo;re building. Twenty seconds
              to skim. Unsubscribe in one click.
            </em>
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="lg:col-span-5"
        >
          <label
            className="editorial-meta block"
            htmlFor="inline-newsletter-email"
            style={{ color: "rgba(245,241,232,0.55)" }}
          >
            Your email address
          </label>
          <div className="mt-3 flex items-end gap-4">
            <input
              id="inline-newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={status === "loading" || status === "success"}
              className="flex-1 bg-transparent px-0 pb-2 text-lg outline-none placeholder:text-[rgba(245,241,232,0.35)] focus:border-accent disabled:opacity-60"
              style={{ color: "#f5f1e8" }}
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="whitespace-nowrap pb-2 text-sm font-bold uppercase tracking-[0.18em] transition disabled:opacity-60"
              style={{ color: "#f5f1e8" }}
            >
              {status === "loading"
                ? "Subscribing…"
                : status === "success"
                  ? "Subscribed ✓"
                  : "Subscribe →"}
            </button>
          </div>
          <p
            className="editorial-meta mt-4"
            style={{ color: "rgba(245,241,232,0.45)" }}
          >
            Once a week · No tracking pixels · Unsubscribe in one click
          </p>
          {status === "success" && (
            <p
              role="status"
              className="mt-3 text-xs"
              style={{ color: "#a7f3d0", fontFamily: "var(--font-serif)" }}
            >
              <em>Check your inbox to confirm — that&rsquo;s the last step.</em>
            </p>
          )}
          {status === "error" && errorMessage && (
            <p
              role="alert"
              className="mt-3 text-xs"
              style={{ color: "#fca5a5", fontFamily: "var(--font-serif)" }}
            >
              <em>{errorMessage}</em>
            </p>
          )}
        </form>
      </div>
    </aside>
  );
}

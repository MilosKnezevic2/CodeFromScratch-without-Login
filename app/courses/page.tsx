"use client";

import { useState } from "react";

export default function CoursesPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "course" }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="animate-fade-up mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-foreground">
          Courses <span className="gradient-text">Coming Soon</span>
        </h1>
        <p className="mt-4 text-muted">
          Structured video courses covering everything from HTML &amp; CSS fundamentals
          to advanced full-stack development. Sign up to get early access.
        </p>

        <div className="mt-4 text-sm text-muted-foreground">
          Goal: <span className="text-accent font-medium">1,000 students</span> on launch day
        </div>

        {status === "success" ? (
          <p className="animate-fade-in mt-6 text-sm text-emerald-400">
            You&apos;re on the list! We&apos;ll notify you when courses are ready.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg gradient-btn px-6 py-2.5 text-sm font-semibold transition disabled:opacity-50"
            >
              {status === "loading" ? "..." : "Notify Me"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-2 text-xs text-red-400">Something went wrong. Please try again.</p>
        )}
      </div>
    </section>
  );
}

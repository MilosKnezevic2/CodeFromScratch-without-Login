"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";

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
    <section className="flex min-h-[70dvh] items-center justify-center px-4">
      <div className="animate-fade-up mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <GraduationCap className="h-8 w-8 text-accent" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-bold text-foreground">
          Courses <span className="gradient-text">Planned — Not Yet Available</span>
        </h1>
        <p className="mt-4 text-muted">
          Structured courses are on the roadmap — from fundamentals to advanced full-stack
          development. They don&apos;t exist yet. Leave your email and you&apos;ll be the first
          to hear when the first course ships. No other emails, no spam.
        </p>

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

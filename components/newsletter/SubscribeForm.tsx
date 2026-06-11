"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

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
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-emerald-400">
        Check your email to confirm your subscription!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        autoComplete="email"
        className="w-0 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-base text-foreground placeholder-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
        suppressHydrationWarning
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg gradient-btn px-4 py-2 text-sm font-medium transition disabled:opacity-50"
        suppressHydrationWarning
      >
        {status === "loading" ? "..." : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-400">Something went wrong</p>
      )}
    </form>
  );
}

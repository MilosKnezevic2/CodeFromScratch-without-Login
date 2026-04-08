"use client";

import { useState } from "react";

export default function EbookNotifyForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "ebook" }),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-emerald-400">
        You&apos;re on the list! We&apos;ll notify you when our ebooks are ready.
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
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
      {status === "error" && (
        <p className="mt-2 text-xs text-red-400">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

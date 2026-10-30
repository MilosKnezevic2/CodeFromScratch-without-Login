"use client";

import { useState } from "react";
import { WAITLIST_LEVELS, WAITLIST_NOTE_MAX, type WaitlistLevel } from "@/lib/course-waitlist";

const LEVEL_LABEL: Record<WaitlistLevel, string> = {
  beginner: "Beginner: I'm just starting out",
  intermediate: "Intermediate: I can build things, but gaps show",
  advanced: "Advanced: I want production-grade depth",
};

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<WaitlistLevel | "">("");
  const [note, setNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/waitlist/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, level, note, honeypot }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(body?.error ?? "Something went wrong. Try again.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-foreground">
        Check your inbox. One click on the confirmation link and you are on the list.
      </p>
    );
  }

  const busy = status === "loading";
  return (
    <form onSubmit={onSubmit} className="relative space-y-6">
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
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">Where are you now?</legend>
        <div className="mt-3 space-y-2">
          {WAITLIST_LEVELS.map((value) => (
            <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted">
              <input
                type="radio"
                name="level"
                value={value}
                checked={level === value}
                onChange={() => setLevel(value)}
                required
                className="h-5 w-5 accent-[var(--color-accent)]"
              />
              {LEVEL_LABEL[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="waitlist-note" className="text-sm font-semibold text-foreground">
          What do you most want to learn?{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="waitlist-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={WAITLIST_NOTE_MAX}
          rows={3}
          className="mt-2 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Please do not write anything personal here. {note.length}/{WAITLIST_NOTE_MAX}
        </p>
      </div>

      <div>
        <label htmlFor="waitlist-email" className="text-sm font-semibold text-foreground">
          Your email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={busy}
          className="mt-2 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-base text-foreground focus:border-accent focus:outline-none disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Put me on the waitlist"}
      </button>
      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm font-medium text-red-400">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

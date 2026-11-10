"use client";

import Link from "next/link";
import { useState } from "react";
import { EXPERIENCE, EXPERIENCE_LABEL, LIMITS, type Experience } from "@/lib/write-for-us";

const field =
  "mt-2 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-base text-foreground focus:border-accent focus:outline-none disabled:opacity-60";
const label = "text-sm font-semibold text-foreground";
const hint = "mt-1 text-xs text-muted-foreground";

/**
 * The pitch form. Controlled inputs and a fetch, not a form action: on a
 * validation error everything the writer typed stays in place.
 */
export default function WriteForUsForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState<Experience | "">("");
  const [topic, setTopic] = useState("");
  const [pitch, setPitch] = useState("");
  const [links, setLinks] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/write-for-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, experience, topic, pitch, links, consent, honeypot }),
      });
      if (res.ok) {
        setStatus("sent");
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setError("Your pitch could not be sent: check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-accent/30 bg-surface p-6 sm:p-8">
        <p className="text-lg font-bold text-foreground">Thank you, your pitch is in.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          I read every pitch myself and answer by email, from office@codefromscratch.org. If it does not show up,
          have a look in your spam folder.
        </p>
      </div>
    );
  }

  const busy = status === "sending";
  return (
    <form onSubmit={onSubmit} className="relative space-y-7">
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="wfu-name" className={label}>
            Your name
          </label>
          <input
            id="wfu-name"
            required
            autoComplete="name"
            maxLength={LIMITS.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            className={field}
          />
          <p className={hint}>As it should appear on the article.</p>
        </div>
        <div>
          <label htmlFor="wfu-email" className={label}>
            Email address
          </label>
          <input
            id="wfu-email"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            maxLength={LIMITS.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className={field}
          />
          <p className={hint}>Only used to answer you.</p>
        </div>
      </div>

      <fieldset>
        <legend className={label}>Where are you as a developer?</legend>
        <div className="mt-3 space-y-1">
          {EXPERIENCE.map((value) => (
            <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted">
              <input
                type="radio"
                name="experience"
                value={value}
                checked={experience === value}
                onChange={() => setExperience(value)}
                required
                disabled={busy}
                className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
              />
              {EXPERIENCE_LABEL[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="wfu-topic" className={label}>
          Working title of your article
        </label>
        <input
          id="wfu-topic"
          required
          minLength={LIMITS.topic.min}
          maxLength={LIMITS.topic.max}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Loading, error and empty states for every fetch"
          disabled={busy}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="wfu-pitch" className={label}>
          Your pitch
        </label>
        <p id="wfu-pitch-hint" className={hint}>
          Who is the reader, what will they be able to do after reading, and why are you the right person to explain
          it? A few sentences are enough.
        </p>
        <textarea
          id="wfu-pitch"
          required
          minLength={LIMITS.pitch.min}
          maxLength={LIMITS.pitch.max}
          rows={7}
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          aria-describedby="wfu-pitch-hint wfu-pitch-count"
          disabled={busy}
          className={field}
        />
        <p id="wfu-pitch-count" className={hint}>
          {pitch.trim().length < LIMITS.pitch.min
            ? `At least ${LIMITS.pitch.min} characters (${pitch.trim().length} so far).`
            : `${pitch.length}/${LIMITS.pitch.max}`}
        </p>
      </div>

      <div>
        <label htmlFor="wfu-links" className={label}>
          Links to your work <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="wfu-links"
          rows={2}
          maxLength={LIMITS.links}
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="GitHub, a blog post you wrote, a project you built"
          disabled={busy}
          className={field}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={busy}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
        />
        <span>
          I&apos;ve read how my details are used in the{" "}
          <Link href="/privacy" className="text-accent underline underline-offset-2">
            privacy policy
          </Link>
          : they are kept only to discuss this article with me.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send my pitch"}
        </button>
        {status === "error" && error && (
          <p role="alert" className="text-sm font-medium text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

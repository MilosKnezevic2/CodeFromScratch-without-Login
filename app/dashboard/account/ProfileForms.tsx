"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { GOAL_MAX, GOAL_MIN, NAME_MAX } from "@/lib/reader/rules";
import { setDisplayName, setEmailChoice, setGoal } from "../actions";

export function NameForm({ name: initial }: { name: string }) {
  const { update } = useSession();
  const [name, setName] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await setDisplayName(name);
          if (!result.ok) return setMessage({ ok: false, text: result.error });
          setName(result.name ?? name);
          // The header reads the name from the session; refresh it there too.
          await update({ name: result.name });
          setMessage({ ok: true, text: "Saved." });
        });
      }}
      className="space-y-2"
    >
      <label htmlFor="display-name" className="block text-sm font-bold text-foreground">
        Display name
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          required
          autoComplete="name"
          aria-invalid={message && !message.ok ? true : undefined}
          aria-describedby="display-name-help"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none focus:border-accent/60 sm:max-w-sm"
        />
        <button type="submit" disabled={pending || name.trim() === initial.trim()} className="h-11 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground disabled:opacity-50">
          Save
        </button>
      </div>
      <p id="display-name-help" className="text-xs text-muted">
        Shown next to your comments.
      </p>
      <p role="status" className={`text-sm ${message?.ok ? "text-accent" : "text-red-600 dark:text-red-300"}`}>
        {message?.text ?? ""}
      </p>
    </form>
  );
}

export function GoalPicker({ goal: initial }: { goal: number }) {
  const [goal, setLocal] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const options = Array.from({ length: GOAL_MAX - GOAL_MIN + 1 }, (_, i) => GOAL_MIN + i);
  return (
    <fieldset className="mt-4">
      <legend className="sr-only">Articles a week</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((n) => (
          <label
            key={n}
            className={`flex h-11 min-w-14 cursor-pointer items-center justify-center rounded-xl border px-3 text-base font-bold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
              goal === n ? "border-accent bg-accent/15 text-foreground" : "border-border text-muted hover:text-foreground"
            }`}
          >
            <input
              type="radio"
              name="weekly-goal"
              value={n}
              checked={goal === n}
              onChange={() => {
                const before = goal;
                setLocal(n);
                startTransition(async () => {
                  const result = await setGoal(n);
                  if (!result.ok) {
                    setLocal(before);
                    setError(result.error);
                  } else setError(null);
                });
              }}
              className="sr-only"
            />
            {n}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Switch({ label, note, on, onChange }: { label: string; note: string; on: boolean; onChange: (on: boolean) => void }) {
  const id = `switch-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-center gap-4 border-t border-border py-4 first:border-t-0">
      <div className="flex-1">
        <p className="font-bold text-foreground">{label}</p>
        <p id={id} className="mt-0.5 text-sm text-muted">
          {note}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        aria-describedby={id}
        onClick={() => onChange(!on)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? "bg-accent" : "bg-surface-2 ring-1 ring-inset ring-border"}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}

export function EmailChoices({
  email,
  newsletterUnsubscribe,
  replies: initialReplies,
  reminder: initialReminder,
}: {
  email: string;
  newsletterUnsubscribe: string | null;
  replies: boolean;
  reminder: boolean;
}) {
  const [replies, setReplies] = useState(initialReplies);
  const [reminder, setReminder] = useState(initialReminder);
  const [newsletter, setNewsletter] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [, startTransition] = useTransition();

  const choose = (kind: "replies" | "reminder", on: boolean, set: (v: boolean) => void) => {
    set(on);
    startTransition(async () => {
      if (!(await setEmailChoice(kind, on)).ok) set(!on);
    });
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-foreground">The newsletter</p>
          <p className="mt-0.5 text-sm text-muted">
            {newsletterUnsubscribe
              ? "You are subscribed: one email when a new article is out."
              : newsletter === "sent"
                ? "Check your inbox and press the confirmation link. Until then nothing is sent."
                : "One email when a new article is out, with the production checklist as a welcome."}
          </p>
        </div>
        {newsletterUnsubscribe ? (
          <a href={newsletterUnsubscribe} className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:border-accent/50">
            Unsubscribe
          </a>
        ) : (
          newsletter !== "sent" && (
            <button
              type="button"
              disabled={newsletter === "sending"}
              onClick={async () => {
                setNewsletter("sending");
                const res = await fetch("/api/newsletter/subscribe", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                }).catch(() => null);
                setNewsletter(res?.ok ? "sent" : "error");
              }}
              className="min-h-11 rounded-xl border border-accent px-4 text-sm font-bold text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {newsletter === "sending" ? "Sending…" : "Subscribe"}
            </button>
          )
        )}
        {newsletter === "error" && (
          <p role="alert" className="w-full text-sm text-red-600 dark:text-red-300">
            That did not work. Try again in a minute.
          </p>
        )}
      </div>
      <Switch
        label="Someone replied to my comment"
        note="A short email with the reply and a link to it, when it is published."
        on={replies}
        onChange={(on) => choose("replies", on, setReplies)}
      />
      <Switch
        label="Sunday reminder"
        note="On Sunday evening: the articles you left unfinished and how close you are to your weekly goal. Skipped when there is nothing to remind you of."
        on={reminder}
        onChange={(on) => choose("reminder", on, setReminder)}
      />
    </div>
  );
}

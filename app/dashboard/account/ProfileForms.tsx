"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

/** Shrinks a photo in the browser before upload: Vercel refuses bodies over 4.5 MB. The server re-encodes it anyway. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return blob ?? file;
  } catch {
    // A format this browser cannot decode (HEIC outside Safari): send it as it is, the server can read it.
    return file;
  }
}

export function AvatarPicker({ image: initialImage, initial, uploaded: initialUploaded }: { image: string | null; initial: string; uploaded: boolean }) {
  const { update } = useSession();
  const router = useRouter();
  const [image, setImage] = useState(initialImage);
  const [uploaded, setUploaded] = useState(initialUploaded);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function done(next: string | null, text: string, isUploaded: boolean) {
    setImage(next);
    setUploaded(isUploaded);
    setMessage({ ok: true, text });
    // The header reads the picture from the session.
    await update({});
    router.refresh();
  }

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    const body = new FormData();
    body.append("file", await shrink(file), file.name);
    const res = await fetch("/api/me/avatar", { method: "POST", body }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { image?: string; error?: string } | null;
    setBusy(false);
    if (!res?.ok || !data?.image) return setMessage({ ok: false, text: data?.error ?? "The upload did not work. Try again." });
    await done(data.image, "New picture saved.", true);
  }

  async function remove() {
    setBusy(true);
    const res = await fetch("/api/me/avatar", { method: "DELETE" }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { image?: string | null } | null;
    setBusy(false);
    if (!res?.ok) return setMessage({ ok: false, text: "That did not work. Try again." });
    await done(data?.image ?? null, data?.image ? "Back to your Google or GitHub picture." : "Picture removed.", false);
  }

  return (
    <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-3">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- an 88 px avatar (ours or from Google/GitHub); the optimizer adds nothing
        <img src={image} alt="" width={88} height={88} referrerPolicy="no-referrer" className={`h-20 w-20 rounded-full object-cover sm:h-22 sm:w-22 ${busy ? "opacity-50" : ""}`} />
      ) : (
        <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-3xl font-extrabold text-accent sm:h-22 sm:w-22">
          {initial}
        </span>
      )}
      <div className="flex flex-col items-start gap-1.5 sm:items-center">
        <input
          ref={input}
          id="avatar-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="min-h-10 rounded-xl border border-border px-3.5 text-sm font-bold text-foreground transition hover:border-accent/50 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Change picture"}
        </button>
        {uploaded && (
          <button type="button" disabled={busy} onClick={() => void remove()} className="min-h-9 text-xs text-muted hover:text-red-500 disabled:opacity-50">
            Remove picture
          </button>
        )}
        <p role="status" className={`max-w-44 text-xs sm:text-center ${message?.ok ? "text-accent" : "text-red-600 dark:text-red-300"}`}>
          {message?.text ?? ""}
        </p>
      </div>
    </div>
  );
}

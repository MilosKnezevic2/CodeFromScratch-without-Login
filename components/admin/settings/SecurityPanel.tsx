"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import {
  cancelMfaAction,
  changePasswordAction,
  changeUsernameAction,
  confirmMfaAction,
  disableMfaAction,
  startMfaAction,
  type ActionResult,
} from "@/app/portal-cfs-admin/settings/actions";
import type { AdminState, Enrolment } from "@/lib/admin-auth";
import SignOutButton from "@/components/admin/SignOutButton";

const INPUT =
  "mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none";
const BUTTON = "min-h-11 rounded-lg gradient-btn px-5 py-2 text-sm font-medium transition disabled:opacity-60";
const QUIET = "inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2";

const when = (value: Date | string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

function Message({ result }: { result: ActionResult<unknown> }) {
  if (!result.message) return <p className="min-h-5" aria-live="polite" />;
  return (
    <p aria-live="polite" className={`rounded-lg px-4 py-3 text-sm ${result.ok ? "bg-emerald-500/20" : "bg-red-500/20"} text-foreground`}>
      {result.message}
    </p>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="glow-border space-y-4 rounded-xl bg-surface p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function PasswordForm({ source }: { source: AdminState["source"] }) {
  const [result, submit, pending] = useActionState(changePasswordAction, { ok: false, message: "" });
  return (
    <form action={submit} className="space-y-4">
      {source === "environment" && (
        <p className="rounded-lg bg-amber-500/20 px-4 py-3 text-sm text-foreground">
          You are still signing in with the start password from Vercel. Set your own here; from then on only this one works, and the
          one on Vercel stops.
        </p>
      )}
      <div>
        <label htmlFor="current-password" className="block text-sm font-medium text-foreground">
          Current password
        </label>
        <input id="current-password" name="current" type="password" autoComplete="current-password" required className={INPUT} />
      </div>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-foreground">
          New password
        </label>
        <input id="new-password" name="next" type="password" autoComplete="new-password" required minLength={12} className={INPUT} />
        <p className="mt-1 text-xs text-muted-foreground">At least 12 characters. A sentence you will remember beats a short jumble.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">
          New password again
        </label>
        <input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required minLength={12} className={INPUT} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? "Changing…" : "Change password"}
        </button>
        <div className="min-w-0 flex-1">
          <Message result={result} />
        </div>
      </div>
    </form>
  );
}

function UsernameForm({ username, disabled }: { username: string | null; disabled: boolean }) {
  const [result, submit, pending] = useActionState(changeUsernameAction, { ok: false, message: "" });
  return (
    <form action={submit} className="space-y-4">
      <div>
        <label htmlFor="new-username" className="block text-sm font-medium text-foreground">
          Username
        </label>
        <input id="new-username" name="username" type="text" defaultValue={username ?? ""} autoComplete="username" required disabled={disabled} className={INPUT} />
        {disabled && <p className="mt-1 text-xs text-muted-foreground">Set your own password first; the username then lives with it.</p>}
      </div>
      <div>
        <label htmlFor="username-password" className="block text-sm font-medium text-foreground">
          Your password, to confirm
        </label>
        <input id="username-password" name="password" type="password" autoComplete="current-password" required disabled={disabled} className={INPUT} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending || disabled} className={BUTTON}>
          {pending ? "Changing…" : "Change username"}
        </button>
        <div className="min-w-0 flex-1">
          <Message result={result} />
        </div>
      </div>
    </form>
  );
}

function MfaEnrol({ onDone }: { onDone: () => void }) {
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [startMessage, setStartMessage] = useState("");
  const [starting, startTransition] = useTransition();
  const [result, submit, pending] = useActionState(confirmMfaAction, { ok: false, message: "" });

  function start() {
    startTransition(async () => {
      const response = await startMfaAction();
      if (response.ok && response.data) setEnrolment(response.data);
      setStartMessage(response.ok ? "" : response.message);
    });
  }

  function cancel() {
    startTransition(async () => {
      await cancelMfaAction();
      setEnrolment(null);
    });
  }

  if (result.ok && result.data) {
    return (
      <div className="space-y-4">
        <Message result={result} />
        <ul className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4" aria-label="Backup codes">
          {result.data.map((code) => (
            <li key={code} className="rounded-lg bg-surface-2 px-3 py-2 text-center text-foreground">
              {code}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Each code signs you in once if your phone is lost. Keep them away from the phone.</p>
        <button type="button" onClick={onDone} className={BUTTON}>
          I have saved them
        </button>
      </div>
    );
  }

  if (!enrolment) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Adds a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password) to every sign-in.
          Someone with your password alone then still cannot get in.
        </p>
        <button type="button" onClick={start} disabled={starting} className={BUTTON}>
          {starting ? "Preparing…" : "Switch on two-step login"}
        </button>
        {startMessage && <p className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-foreground">{startMessage}</p>}
      </div>
    );
  }

  return (
    <form action={submit} className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* A trusted PNG built on the server from the enrolment secret; it is only ever shown to the signed-in administrator. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- a data URL, not an asset to optimise */}
        <img src={enrolment.qrCodeDataUrl} alt="QR code for the authenticator app" width={176} height={176} className="rounded-lg bg-white p-2" />
        <div className="min-w-0 space-y-2 text-sm text-muted-foreground">
          <p>1. Open the authenticator app and scan this code.</p>
          <p>
            2. If scanning fails, enter this key by hand: <code className="break-all font-mono text-foreground">{enrolment.secret}</code>
          </p>
          <p>3. Type the 6 digits the app shows now.</p>
        </div>
      </div>
      <div>
        <label htmlFor="mfa-confirm-code" className="block text-sm font-medium text-foreground">
          6-digit code
        </label>
        <input
          id="mfa-confirm-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          className={`${INPUT} max-w-xs font-mono tracking-widest`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? "Checking…" : "Confirm and switch on"}
        </button>
        <button type="button" onClick={cancel} disabled={starting} className={QUIET}>
          Cancel
        </button>
        <div className="min-w-0 flex-1">
          <Message result={result} />
        </div>
      </div>
    </form>
  );
}

function MfaDisable({ backupCodesLeft }: { backupCodesLeft: number }) {
  const [result, submit, pending] = useActionState(disableMfaAction, { ok: false, message: "" });
  return (
    <form action={submit} className="space-y-4">
      <p className="rounded-lg bg-emerald-500/20 px-4 py-3 text-sm text-foreground">
        Two-step login is on. {backupCodesLeft} backup code{backupCodesLeft === 1 ? "" : "s"} left.
      </p>
      <div>
        <label htmlFor="mfa-disable-code" className="block text-sm font-medium text-foreground">
          Code from the app, or a backup code, to switch it off
        </label>
        <input id="mfa-disable-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" required className={`${INPUT} max-w-xs font-mono tracking-widest`} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={QUIET}>
          {pending ? "Switching off…" : "Switch off two-step login"}
        </button>
        <div className="min-w-0 flex-1">
          <Message result={result} />
        </div>
      </div>
    </form>
  );
}

export default function SecurityPanel({
  state,
  session,
}: {
  state: AdminState;
  session: { issuedAt: Date | null; expiresAt: Date | null };
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Security</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Your sign-in, two-step login and the current session.</p>
      </div>

      {state.source === "unavailable" && (
        <p className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-foreground">The account cannot be read right now. Try again in a minute.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Account">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Username</dt>
              <dd className="font-medium text-foreground">{state.username ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Password stored</dt>
              <dd className="font-medium text-foreground">{state.source === "database" ? "In the database, hashed" : "On Vercel (start password)"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Password changed</dt>
              <dd className="font-medium text-foreground">{when(state.passwordChangedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last sign-in</dt>
              <dd className="font-medium text-foreground">{when(state.lastLoginAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="This session">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Signed in</dt>
              <dd className="font-medium text-foreground">{when(session.issuedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Signs out by itself</dt>
              <dd className="font-medium text-foreground">{when(session.expiresAt)}</dd>
            </div>
          </dl>
          <SignOutButton className={QUIET} />
        </Card>
      </div>

      <Card title="Change password">
        <PasswordForm source={state.source} />
      </Card>

      <Card title="Change username">
        <UsernameForm username={state.username} disabled={state.source !== "database"} />
      </Card>

      <Card title="Two-step login">
        {state.mfaSource === "environment" ? (
          <p className="text-sm text-muted-foreground">
            Two-step login is on through the Vercel setting. Once you set your own password above, you can manage it here instead.
          </p>
        ) : state.mfaEnabled ? (
          <MfaDisable backupCodesLeft={state.backupCodesLeft} />
        ) : state.source !== "database" ? (
          <p className="text-sm text-muted-foreground">Set your own password first, then switch on two-step login here.</p>
        ) : (
          <MfaEnrol onDone={() => router.refresh()} />
        )}
      </Card>
    </div>
  );
}

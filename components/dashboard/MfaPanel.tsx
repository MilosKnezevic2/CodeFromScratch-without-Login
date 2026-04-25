"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initiallyEnabled: boolean;
  verifiedAt: string | null;
  backupCodesRemaining: number;
  hasPassword: boolean;
};

type EnrolmentPayload = {
  qrCodeDataUrl: string;
  otpauthUri: string;
  backupCodes: string[];
};

function formatBackupCode(code: string): string {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

export default function MfaPanel({
  initiallyEnabled,
  verifiedAt,
  backupCodesRemaining,
  hasPassword,
}: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [phase, setPhase] = useState<"idle" | "enrolling" | "disabling">("idle");
  const [enrolment, setEnrolment] = useState<EnrolmentPayload | null>(null);
  const [code, setCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableTotp, setDisableTotp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [acknowledgedCodes, setAcknowledgedCodes] = useState(false);

  async function beginEnrolment() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/user/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start enrolment");
        return;
      }
      setEnrolment(data);
      setPhase("enrolling");
      setAcknowledgedCodes(false);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnrolment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), type: "totp" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        return;
      }
      setMessage("Two-factor authentication is now active on your account.");
      setEnabled(true);
      setPhase("idle");
      setEnrolment(null);
      setCode("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function submitDisable(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = hasPassword
        ? { password: disablePassword }
        : { totpCode: disableTotp.trim() };
      const res = await fetch("/api/user/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not disable MFA");
        return;
      }
      setMessage("Two-factor authentication disabled.");
      setEnabled(false);
      setPhase("idle");
      setDisablePassword("");
      setDisableTotp("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setPhase("idle");
    setEnrolment(null);
    setCode("");
    setDisablePassword("");
    setDisableTotp("");
    setError("");
  }

  function downloadBackupCodes() {
    if (!enrolment) return;
    const text = [
      "CodeFromScratch — MFA backup codes",
      "Keep these somewhere safe. Each code works once.",
      "",
      ...enrolment.backupCodes.map(formatBackupCode),
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codefromscratch-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl space-y-4">
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent"
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {phase === "idle" && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  Two-factor authentication
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    enabled
                      ? "bg-accent/15 text-accent"
                      : "bg-surface-2 text-muted-foreground"
                  }`}
                >
                  {enabled ? "Active" : "Off"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Require a one-time code from an authenticator app every time you
                sign in. Even if your password leaks, your account stays locked.
              </p>
              {enabled && verifiedAt && (
                <p className="text-xs text-muted-foreground">
                  Enrolled{" "}
                  {new Date(verifiedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {backupCodesRemaining} backup code
                  {backupCodesRemaining === 1 ? "" : "s"} remaining
                </p>
              )}
            </div>
            {enabled ? (
              <button
                type="button"
                onClick={() => setPhase("disabling")}
                className="shrink-0 rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2/70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
              >
                Disable
              </button>
            ) : (
              <button
                type="button"
                onClick={beginEnrolment}
                disabled={loading}
                className="shrink-0 gradient-btn rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                {loading ? "Starting…" : "Enable"}
              </button>
            )}
          </div>

          {enabled && backupCodesRemaining <= 3 && (
            <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400">
              Only {backupCodesRemaining} backup code
              {backupCodesRemaining === 1 ? "" : "s"} left. Disable and re-enable
              MFA to regenerate a fresh set.
            </div>
          )}
        </div>
      )}

      {phase === "enrolling" && enrolment && (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Step 1 — Scan with your authenticator
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open Google Authenticator, 1Password, Authy, or another TOTP app
              and scan this QR code. Can&apos;t scan?{" "}
              <a
                href={enrolment.otpauthUri}
                className="underline decoration-dotted hover:text-foreground"
              >
                Tap to add manually
              </a>
              .
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-2 p-4 sm:flex-row sm:items-start">
            {/* Image is generated server-side as a trusted data URL (PNG from `qrcode`). Lighthouse LCP guidance does not apply to base-64 QR previews inside a non-LCP panel. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enrolment.qrCodeDataUrl}
              alt="QR code — scan to add CodeFromScratch to your authenticator app"
              width={192}
              height={192}
              className="rounded-lg bg-white p-2"
            />
            <div className="flex-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Step 2 — Save your backup codes
              </p>
              <p className="mt-1">
                If you lose your phone, each backup code below lets you sign in
                once. Store them somewhere safe — a password manager is ideal.
                We will not show them again.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-2/50 p-4">
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-foreground sm:grid-cols-5">
              {enrolment.backupCodes.map((bc) => (
                <li
                  key={bc}
                  className="rounded-md bg-surface px-2 py-1.5 text-center"
                >
                  {formatBackupCode(bc)}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadBackupCodes}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-2/70"
              >
                Download as .txt
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    enrolment.backupCodes.map(formatBackupCode).join("\n"),
                  );
                }}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-2/70"
              >
                Copy to clipboard
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={acknowledgedCodes}
              onChange={(e) => setAcknowledgedCodes(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border bg-surface-2 text-accent focus:ring-accent"
            />
            I have saved my backup codes somewhere safe.
          </label>

          <form onSubmit={confirmEnrolment} className="space-y-3 pt-2">
            <div>
              <label
                htmlFor="mfa-code"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Step 3 — Enter the 6-digit code
              </label>
              <input
                id="mfa-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="w-full max-w-[12rem] rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading || !acknowledgedCodes || code.length !== 6}
                className="gradient-btn rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Confirm and enable"}
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={loading}
                className="rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2/70"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {phase === "disabling" && (
        <form
          onSubmit={submitDisable}
          className="space-y-4 rounded-2xl border border-border bg-surface p-6"
        >
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Disable two-factor authentication
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasPassword
                ? "Enter your account password to confirm."
                : "Enter the current 6-digit code from your authenticator to confirm."}{" "}
              Disabling will permanently delete your current secret and backup
              codes. Re-enabling later issues a fresh secret.
            </p>
          </div>

          {hasPassword ? (
            <div>
              <label
                htmlFor="mfa-disable-password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="mfa-disable-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full max-w-md rounded-xl border border-border bg-surface-2/50 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="mfa-disable-totp"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                6-digit code
              </label>
              <input
                id="mfa-disable-totp"
                name="totpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={disableTotp}
                onChange={(e) =>
                  setDisableTotp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="w-full max-w-[12rem] rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-500/90 disabled:opacity-50"
            >
              {loading ? "Disabling…" : "Disable MFA"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={loading}
              className="rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2/70"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

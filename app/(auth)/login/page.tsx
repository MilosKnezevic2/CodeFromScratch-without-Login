"use client";

import { signIn, getProviders } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-border bg-surface p-8 shadow-xl animate-pulse">
          <div className="h-8 w-32 bg-surface-2 rounded mb-6" />
          <div className="space-y-4">
            <div className="h-10 bg-surface-2 rounded" />
            <div className="h-10 bg-surface-2 rounded" />
            <div className="h-10 bg-surface-2 rounded" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

type Stage = "credentials" | "mfa";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);
  const [hasGithub, setHasGithub] = useState(false);

  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaType, setMfaType] = useState<"totp" | "backup">("totp");

  useEffect(() => {
    getProviders().then((providers) => {
      if (providers?.google) setHasGoogle(true);
      if (providers?.github) setHasGithub(true);
    });
  }, []);

  async function finishSignIn(code: string, type: "totp" | "backup") {
    const result = await signIn("credentials", {
      email,
      password,
      mfaCode: code,
      mfaType: type,
      redirect: false,
    });
    if (result?.error) {
      setError(
        type === "totp"
          ? "Invalid code. Try again."
          : "Invalid backup code. Try again.",
      );
      return false;
    }
    router.push(callbackUrl);
    router.refresh();
    return true;
  }

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const probe = await fetch("/api/auth/mfa-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (probe.status === 429) {
        const data = await probe.json().catch(() => ({}));
        setError(data.error || "Too many attempts. Try again later.");
        return;
      }

      const data = await probe.json().catch(() => ({ ok: false }));
      if (!data.ok) {
        setError("Invalid email or password");
        return;
      }

      if (data.mfaRequired) {
        setStage("mfa");
        setMfaCode("");
        setMfaType("totp");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await finishSignIn(mfaCode.trim(), mfaType);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function backToCredentials() {
    setStage("credentials");
    setMfaCode("");
    setError("");
  }

  const showOAuth = hasGoogle || hasGithub;

  if (stage === "mfa") {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Two-factor authentication
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mfaType === "totp"
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of your backup codes."}
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleMfaSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="mfaCode"
              className="block text-sm font-medium text-muted"
            >
              {mfaType === "totp" ? "6-digit code" : "Backup code"}
            </label>
            <input
              id="mfaCode"
              name="mfaCode"
              type="text"
              inputMode={mfaType === "totp" ? "numeric" : "text"}
              autoComplete="one-time-code"
              autoFocus
              required
              value={mfaCode}
              onChange={(e) => {
                if (mfaType === "totp") {
                  setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                } else {
                  setMfaCode(
                    e.target.value
                      .replace(/[^0-9A-Fa-f-]/g, "")
                      .toUpperCase()
                      .slice(0, 11),
                  );
                }
              }}
              placeholder={mfaType === "totp" ? "123456" : "ABCDE-12345"}
              className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] text-foreground placeholder-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              (mfaType === "totp" && mfaCode.length !== 6) ||
              (mfaType === "backup" && mfaCode.replace(/-/g, "").length !== 10)
            }
            className="w-full rounded-lg gradient-btn px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify and sign in"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setMfaType(mfaType === "totp" ? "backup" : "totp");
              setMfaCode("");
              setError("");
            }}
            className="text-accent transition hover:text-accent-2"
          >
            {mfaType === "totp"
              ? "Use a backup code instead"
              : "Use authenticator app"}
          </button>
          <button
            type="button"
            onClick={backToCredentials}
            className="text-muted-foreground transition hover:text-foreground"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Sign In</h1>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-muted"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-muted"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg gradient-btn px-4 py-2 text-sm font-medium transition disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {showOAuth && (
        <>
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-4 text-sm text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="space-y-3">
            {hasGoogle && (
              <button
                onClick={() => signIn("google", { callbackUrl })}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2/50 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            )}

            {hasGithub && (
              <button
                onClick={() => signIn("github", { callbackUrl })}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2/50 transition"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            )}
          </div>
        </>
      )}

      <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:text-accent-2 transition">
            Sign up
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="text-accent hover:text-accent-2 transition">
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}

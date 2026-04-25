"use client";

import { useState } from "react";

type Stage = "credentials" | "mfa";

export default function AdminLoginPage() {
  const [stage, setStage] = useState<Stage>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const probe = await fetch("/api/admin-auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (probe.status === 429) {
        const data = await probe.json().catch(() => ({}));
        setError(data.error || "Too many attempts. Try again later.");
        return;
      }
      if (probe.status === 503) {
        setError("Admin authentication not configured");
        return;
      }

      const data = await probe.json().catch(() => ({ ok: false }));
      if (!data.ok) {
        setError("Invalid credentials");
        return;
      }

      if (data.mfaRequired) {
        setStage("mfa");
        setCode("");
        return;
      }

      const res = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.error || "Invalid credentials");
        return;
      }
      window.location.href = "/portal-cfs-admin";
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, code: code.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.error || "Invalid code");
        return;
      }
      window.location.href = "/portal-cfs-admin";
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "mfa") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-xl">
          <h1 className="mb-2 text-2xl font-bold text-foreground text-center">
            Two-factor verification
          </h1>
          <p className="mb-6 text-center text-sm text-muted">
            Enter the 6-digit code from your authenticator app
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
                htmlFor="code"
                className="block text-sm font-medium text-muted"
              >
                6-digit code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] text-foreground placeholder-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg gradient-btn px-4 py-2 text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify and sign in"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setStage("credentials");
              setCode("");
              setError("");
            }}
            className="mt-6 w-full text-center text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold text-foreground text-center">
          Admin Access
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          CodeFromScratch Administration
        </p>

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
              htmlFor="username"
              className="block text-sm font-medium text-muted"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
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
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
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
      </div>
    </div>
  );
}

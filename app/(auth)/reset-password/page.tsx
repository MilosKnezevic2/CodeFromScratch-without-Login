"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-border bg-surface p-8 shadow-sm animate-pulse"><div className="h-8 w-48 bg-surface-2 rounded mb-6" /><div className="space-y-4"><div className="h-10 bg-surface-2 rounded" /><div className="h-10 bg-surface-2 rounded" /></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token || !email) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 shadow-sm text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Invalid Link</h1>
        <p className="text-muted">This password reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-500">
          Request a new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/login?message=Password reset successfully");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Reset Password</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-muted">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-foreground shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-foreground shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

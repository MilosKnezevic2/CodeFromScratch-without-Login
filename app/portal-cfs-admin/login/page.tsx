"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        window.location.href = "/portal-cfs-admin";
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Invalid credentials");
      }
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
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
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-muted">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground placeholder-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
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

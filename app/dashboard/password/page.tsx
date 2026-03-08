"use client";

import { useState } from "react";

export default function PasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password updated successfully");
        (e.target as HTMLFormElement).reset();
      } else {
        setError(data.error || "Failed to update password");
      }
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  const inputClass =
    "mt-1 block w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Change Password</h1>

      {message && (
        <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-3 text-sm text-accent">{message}</div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted">Current Password</label>
          <input name="currentPassword" type="password" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted">New Password</label>
          <input name="newPassword" type="password" required minLength={8} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted">Confirm New Password</label>
          <input name="confirmPassword" type="password" required minLength={8} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="cta-glow rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

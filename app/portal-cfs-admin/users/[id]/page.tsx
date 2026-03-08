"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
  subscription: { plan: string; status: string } | null;
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then(setUser);
  }, [id]);

  async function updateUser(data: Record<string, unknown>) {
    setLoading(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const res = await fetch(`/api/admin/users/${id}`);
    setUser(await res.json());
    setLoading(false);
  }

  if (!user) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-lg space-y-6">
      <button onClick={() => router.back()} className="text-sm text-muted hover:text-accent transition">
        &larr; Back to users
      </button>
      <h1 className="text-2xl font-bold text-foreground">
        {user.name || user.email}
      </h1>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Email</span>
          <span className="text-foreground">{user.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Role</span>
          <span className="text-foreground">{user.role}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Plan</span>
          <span className="text-foreground">{user.subscription?.plan || "FREE"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Joined</span>
          <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Banned</span>
          <span className="text-foreground">{user.banned ? "Yes" : "No"}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => updateUser({ role: user.role === "ADMIN" ? "USER" : "ADMIN" })}
          disabled={loading}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface transition disabled:opacity-50"
        >
          {user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
        </button>
        <button
          onClick={() => updateUser({ banned: !user.banned })}
          disabled={loading}
          className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition ${
            user.banned
              ? "border border-accent/30 text-accent hover:bg-accent/10"
              : "border border-red-400/30 text-red-400 hover:bg-red-400/10"
          }`}
        >
          {user.banned ? "Unban User" : "Ban User"}
        </button>
      </div>
    </div>
  );
}

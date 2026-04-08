"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Badge from "@/components/admin/Badge";

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
  interests: string[];
  subscription: { plan: string; status: string; stripeSubscriptionId?: string; currentPeriodEnd?: string } | null;
  readingHistory: { postSlug: string; readAt: string; scrollPercent: number; completedAt: string | null }[];
  savedPosts: { postSlug: string; createdAt: string }[];
  ebookPurchases: { createdAt: string; ebook: { title: string; price: number } }[];
  _count: { readingHistory: number; savedPosts: number; reactions: number; ebookPurchases: number };
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");
  const [planSelect, setPlanSelect] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setPlanSelect(data.subscription?.plan || "FREE");
      });
  }, [id]);

  async function updateUser(data: Record<string, unknown>) {
    setLoading(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const res = await fetch(`/api/admin/users/${id}`);
    const updated = await res.json();
    setUser(updated);
    setPlanSelect(updated.subscription?.plan || "FREE");
    setLoading(false);
  }

  async function deleteUser() {
    if (!confirm("Permanently delete this user and all their data? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    router.push("/portal-cfs-admin/users");
  }

  if (!user) return <div className="text-muted-foreground">Loading...</div>;

  const safeUser = {
    ...user,
    role: user.role || "USER",
    interests: Array.isArray(user.interests) ? user.interests : [],
    readingHistory: user.readingHistory || [],
    savedPosts: user.savedPosts || [],
    ebookPurchases: user.ebookPurchases || [],
    _count: user._count || { readingHistory: 0, savedPosts: 0, reactions: 0, ebookPurchases: 0 },
  };

  const tabs = ["overview", "activity", "subscription", "purchases"];

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-accent transition">
        &larr; Back to users
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.image ? (
            <img src={user.image} alt={user.name || "User"} className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-xl font-bold text-accent">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              {user.name || "Unnamed User"}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={(user.role || "USER").toLowerCase()}>{user.role || "USER"}</Badge>
          <Badge variant={(user.subscription?.plan ?? "FREE").toLowerCase().replace("_", "-")}>
            {user.subscription?.plan ?? "FREE"}
          </Badge>
          {user.banned && <Badge variant="banned">BANNED</Badge>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition ${
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Info card */}
          <div className="glow-border rounded-xl bg-surface p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Joined</span>
                <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Articles read</span>
                <span className="text-foreground">{safeUser._count.readingHistory}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Posts saved</span>
                <span className="text-foreground">{safeUser._count.savedPosts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reactions given</span>
                <span className="text-foreground">{safeUser._count.reactions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ebooks purchased</span>
                <span className="text-foreground">{safeUser._count.ebookPurchases}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interests</span>
                <span className="text-foreground">{safeUser.interests.length > 0 ? safeUser.interests.join(", ") : "None"}</span>
              </div>
            </div>
          </div>

          {/* Plan selector */}
          <div className="glow-border rounded-xl bg-surface p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Subscription Plan</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["FREE", "PRO", "PRO_PLUS"] as const).map((plan) => {
                const isActive = planSelect === plan;
                const labels = { FREE: "Free", PRO: "Pro", PRO_PLUS: "Pro+" };
                const prices = { FREE: "$0", PRO: "$9/mo", PRO_PLUS: "$19/mo" };
                return (
                  <button
                    key={plan}
                    onClick={() => setPlanSelect(plan)}
                    className={`rounded-xl border-2 p-3 text-center transition ${
                      isActive
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/30"
                    }`}
                  >
                    <p className={`text-sm font-bold ${isActive ? "text-accent" : "text-foreground"}`}>{labels[plan]}</p>
                    <p className="text-[11px] text-muted-foreground">{prices[plan]}</p>
                  </button>
                );
              })}
            </div>
            {planSelect !== (user.subscription?.plan || "FREE") && (
              <button
                onClick={() => updateUser({ plan: planSelect })}
                disabled={loading}
                className="mt-3 w-full rounded-lg bg-accent/10 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50"
              >
                {loading ? "Applying..." : `Change to ${planSelect}`}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="glow-border rounded-xl bg-surface p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</h3>
            <div className="space-y-4">

              {/* Role + Ban */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateUser({ role: user.role === "ADMIN" ? "USER" : "ADMIN" })}
                  disabled={loading}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-2 disabled:opacity-50"
                >
                  {user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                </button>
                <button
                  onClick={() => updateUser({ banned: !user.banned })}
                  disabled={loading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                    user.banned
                      ? "border border-green-400/30 text-green-400 hover:bg-green-400/10"
                      : "border border-red-400/30 text-red-400 hover:bg-red-400/10"
                  }`}
                >
                  {user.banned ? "Unban" : "Ban"}
                </button>
                <button
                  onClick={deleteUser}
                  disabled={loading}
                  className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="glow-border overflow-hidden rounded-xl bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reading History (last 20)</h3>
          </div>
          <div className="divide-y divide-border">
            {safeUser.readingHistory.map((r, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <span className="flex-1 truncate text-sm text-foreground">{r.postSlug}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${r.scrollPercent}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{r.scrollPercent}%</span>
                </div>
                {r.completedAt && <span className="text-xs text-green-400">completed</span>}
                <span className="text-xs text-muted-foreground">{new Date(r.readAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
              </div>
            ))}
            {safeUser.readingHistory.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No reading history</div>
            )}
          </div>
        </div>
      )}

      {tab === "subscription" && (
        <div className="glow-border rounded-xl bg-surface p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subscription Details</h3>
          {user.subscription ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><Badge variant={user.subscription.plan.toLowerCase().replace("_", "-")}>{user.subscription.plan}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={user.subscription.status.toLowerCase()}>{user.subscription.status}</Badge></div>
              {user.subscription.stripeSubscriptionId && (
                <div className="flex justify-between"><span className="text-muted-foreground">Stripe ID</span><span className="font-mono text-xs text-foreground">{user.subscription.stripeSubscriptionId}</span></div>
              )}
              {user.subscription.currentPeriodEnd && (
                <div className="flex justify-between"><span className="text-muted-foreground">Period ends</span><span className="text-foreground">{new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}</span></div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No subscription — Free plan</p>
          )}
        </div>
      )}

      {tab === "purchases" && (
        <div className="glow-border overflow-hidden rounded-xl bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ebook Purchases</h3>
          </div>
          <div className="divide-y divide-border">
            {safeUser.ebookPurchases.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-medium text-foreground">{p.ebook.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-accent">${(p.ebook.price / 100).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                </div>
              </div>
            ))}
            {safeUser.ebookPurchases.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No purchases</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

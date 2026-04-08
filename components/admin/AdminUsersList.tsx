"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Badge from "./Badge";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
  plan: string;
}

export default function AdminUsersList({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterRole, setFilterRole] = useState("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      const matchPlan = filterPlan === "all" || (u.plan) === filterPlan;
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchPlan && matchRole;
    });
  }, [users, search, filterPlan, filterRole]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{users.length} total · {filtered.length} shown</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground transition focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All Plans</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="PRO_PLUS">Pro+</option>
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* User list */}
      <div className="glow-border overflow-hidden rounded-xl bg-surface">
        <div className="divide-y divide-border">
          {filtered.map((user) => (
            <Link
              key={user.id}
              href={`/portal-cfs-admin/users/${user.id}`}
              className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-surface-2/50"
            >
              {/* Avatar */}
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name || "Unnamed"}
                  </p>
                  {user.banned && <Badge variant="banned">Banned</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>

              {/* Badges */}
              <Badge variant={(user.role || "USER").toLowerCase()}>{user.role || "USER"}</Badge>
              <Badge variant={user.plan.toLowerCase().replace("_", "-")}>
                {user.plan}
              </Badge>

              {/* Date */}
              <span className="hidden text-xs text-muted-foreground sm:block">
                {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>

              {/* Arrow */}
              <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No users match your filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

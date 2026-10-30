"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Ends the admin session and returns to the login page. */
export default function SignOutButton({ className, label = "Sign out" }: { className?: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/admin-auth/logout", { method: "POST" });
    } finally {
      router.replace("/portal-cfs-admin/login");
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className={className}>
      {busy ? "Signing out…" : label}
    </button>
  );
}

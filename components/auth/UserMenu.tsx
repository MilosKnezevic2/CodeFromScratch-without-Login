"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center text-sm font-medium text-muted transition hover:text-foreground"
      >
        Sign in
      </Link>
    );
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Your account"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-medium transition"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- a 32 px avatar from Google or GitHub; the optimizer adds nothing
          <img
            src={session.user.image}
            alt=""
            width={32}
            height={32}
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-full"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-border bg-surface-2 py-1 shadow-xl">
          <div className="border-b border-border px-4 py-2">
            <p className="text-sm font-medium text-foreground">
              {session.user.name}
            </p>
            <p className="text-xs text-muted">{session.user.email}</p>
          </div>

          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-muted hover:bg-surface-2/50 hover:text-accent transition"
          >
            Your account
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: window.location.pathname })}
            className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-surface-2/50 transition"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

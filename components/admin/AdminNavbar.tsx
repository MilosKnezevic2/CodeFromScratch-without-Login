"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "../ThemeToggle";

const links = [
  { href: "/portal-cfs-admin", label: "Dashboard" },
  { href: "/portal-cfs-admin/studio", label: "Content Studio" },
  { href: "/portal-cfs-admin/users", label: "Users" },
  { href: "/portal-cfs-admin/newsletter", label: "Newsletter" },
  { href: "/portal-cfs-admin/ebooks", label: "Ebooks" },
  { href: "/portal-cfs-admin/courses", label: "Courses" },
  { href: "/portal-cfs-admin/contacts", label: "Contact Messages" },
  { href: "/portal-cfs-admin/analytics", label: "Analytics" },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/portal-cfs-admin") return pathname === "/portal-cfs-admin";
    return pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-border/50 bg-surface">
      <div className="mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Left — branding */}
        <Link
          href="/portal-cfs-admin"
          className="text-lg font-bold tracking-tight text-accent"
        >
          CFS Admin
        </Link>

        {/* Center — desktop nav links */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                isActive(link.href)
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right — theme toggle + back to site + mobile hamburger */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="hidden text-sm text-muted transition hover:text-accent sm:inline-block"
          >
            Back to site
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted hover:bg-surface-2 hover:text-accent transition lg:hidden"
            aria-label="Toggle admin menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-border/50 px-4 py-2 lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                isActive(link.href)
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-muted transition hover:text-accent sm:hidden"
          >
            Back to site
          </Link>
        </div>
      )}
    </nav>
  );
}

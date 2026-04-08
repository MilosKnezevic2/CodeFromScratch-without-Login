"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/portal-cfs-admin", label: "Overview" },
  { href: "/portal-cfs-admin/analytics", label: "Analytics" },
  { href: "/portal-cfs-admin/content", label: "Content" },
  { href: "/portal-cfs-admin/users", label: "Users" },
  { href: "/portal-cfs-admin/revenue", label: "Revenue" },
  { href: "/portal-cfs-admin/newsletter", label: "Newsletter" },
  { href: "/portal-cfs-admin/contacts", label: "Contacts" },
  { href: "/portal-cfs-admin/studio", label: "CMS Studio" },
  { href: "/portal-cfs-admin/settings", label: "Settings" },
];

export default function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  if (!mounted && typeof window !== "undefined") setMounted(true);

  const drawer = open && mounted ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/60" onClick={() => setOpen(false)} />
      <div className="fixed inset-y-0 left-0 z-[9999] w-64 overflow-y-auto bg-surface p-4 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="gradient-text text-sm font-extrabold">CFS Admin</span>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="space-y-1" onClick={() => setOpen(false)}>
          {links.map((link) => {
            const isActive = link.href === "/portal-cfs-admin"
              ? pathname === "/portal-cfs-admin"
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 border-t border-border pt-4">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition">
            Back to site
          </Link>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="flex h-14 items-center border-b border-border px-4 lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        Menu
      </button>
      <span className="ml-auto gradient-text text-sm font-bold">CFS Admin</span>
      {drawer}
    </div>
  );
}

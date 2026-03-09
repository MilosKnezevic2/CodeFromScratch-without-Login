"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/dashboard/saved", label: "Saved Posts", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
  { href: "/dashboard/collections", label: "Collections", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { href: "/dashboard/ebooks", label: "My Ebooks", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
];

const accountLinks = [
  { href: "/dashboard/subscription", label: "Subscription", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { href: "/dashboard/newsletter", label: "Newsletter", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { href: "/dashboard/profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/dashboard/password", label: "Password", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
];

function NavGroup({ title, items }: { title: string; items: typeof links }) {
  const pathname = usePathname();

  return (
    <div>
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(45,212,191,0.15)]"
                  : "text-muted hover:bg-surface-2/50 hover:text-foreground"
              }`}
            >
              <svg
                className={`h-[18px] w-[18px] shrink-0 transition ${isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
              {link.label}
              {isActive && (
                <div className="ml-auto h-3 w-3 rounded-full border border-accent bg-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardSidebar() {
  return (
    <nav className="space-y-6 rounded-2xl border border-border bg-surface p-4">
      <NavGroup title="Content" items={links} />
      <div className="h-px bg-border" />
      <NavGroup title="Account" items={accountLinks} />
    </nav>
  );
}

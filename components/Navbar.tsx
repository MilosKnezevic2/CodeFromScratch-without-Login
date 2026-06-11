"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import SearchModal from "./blog/SearchModal";
import Logo from "./Logo";

// Public-facing nav. Ebooks, Courses, and the user menu are wired up in
// code (routes still exist under app/*) but hidden from this list while
// the backend for those features is being built. To re-enable: add the
// link back here and restore <UserMenu /> in the desktop + mobile blocks.
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: close the mobile menu on client-side navigation (pathname change is the external signal the menu must react to).
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex gap-1">
            {navLinks.map((link) => {
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link rounded-lg px-3 py-1.5 text-sm transition ${
                    isActive
                      ? "active text-accent font-medium"
                      : "text-muted hover:text-foreground hover:bg-surface/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <SearchModal />
          <ThemeToggle />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface md:hidden"
          aria-label="Toggle menu"
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-border bg-background/98 backdrop-blur-md px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => {
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-muted hover:text-foreground hover:bg-surface/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

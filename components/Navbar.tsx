"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import SearchModal from "./blog/SearchModal";
import Logo from "./Logo";
import UserMenu from "./auth/UserMenu";
import { useSession } from "next-auth/react";

// Public-facing nav. Ebooks, Courses, and the user menu are wired up in
// code (routes still exist under app/*) but hidden from this list while
// the backend for those features is being built. To re-enable: add the
// link back here and restore <UserMenu /> in the desktop + mobile blocks.
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

/** `accounts`: reader sign-in is switched on in Settings, so the header offers it. */
export default function Navbar({ accounts }: { accounts: boolean }) {
  const pathname = usePathname();
  const { data: session } = useSession();
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
          {accounts && <UserMenu />}
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
          {/* A plain GET form to the journal's search page: works before any script loads. */}
          <form action="/blog/search" method="get" role="search" className="pt-3">
            <label htmlFor="mobile-search" className="sr-only">
              Search articles
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 focus-within:border-accent/50">
              <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="mobile-search"
                name="q"
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                minLength={2}
                maxLength={100}
                required
                placeholder="Search articles..."
                className="h-11 min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </form>
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
            {accounts && (
              <Link
                href={session?.user ? "/account" : `/login?callbackUrl=${encodeURIComponent(pathname)}`}
                className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface/50 hover:text-foreground"
              >
                {session?.user ? "Your account" : "Sign in"}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

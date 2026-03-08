import Link from "next/link";
import SubscribeForm from "./newsletter/SubscribeForm";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      {/* Main footer */}
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block text-xl font-bold text-foreground">
              Code<span className="gradient-text">FromScratch</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Hands-on tutorials, in-depth guides, and premium resources to help
              you master modern web development.
            </p>

            {/* Social links */}
            <div className="mt-6 flex gap-3">
              <a
                href="https://github.com/MilosKnezevic2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2/50 text-muted transition hover:border-accent/40 hover:text-accent"
                aria-label="GitHub"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2/50 text-muted transition hover:border-accent/40 hover:text-accent"
                aria-label="X (Twitter)"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2/50 text-muted transition hover:border-accent/40 hover:text-accent"
                aria-label="YouTube"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/blog" className="text-muted transition hover:text-accent">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/ebooks" className="text-muted transition hover:text-accent">
                  Ebooks
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-muted transition hover:text-accent">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted transition hover:text-accent">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Company
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/contact" className="text-muted transition hover:text-accent">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted transition hover:text-accent">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted transition hover:text-accent">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted transition hover:text-accent">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Stay Updated
            </h4>
            <p className="mt-4 text-sm text-muted">
              Get weekly tutorials and tips delivered straight to your inbox. No spam, unsubscribe anytime.
            </p>
            <div className="mt-4">
              <SubscribeForm />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground">
            &copy; {year} CodeFromScratch. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a
              href="mailto:office@codefromscratch.org"
              className="transition hover:text-accent"
            >
              office@codefromscratch.org
            </a>
            <span className="hidden text-border sm:inline">|</span>
            <Link href="/blog/rss.xml" className="transition hover:text-accent">
              RSS Feed
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

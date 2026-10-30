import Link from "next/link";
import SubscribeForm from "./newsletter/SubscribeForm";
import Logo from "./Logo";
import SocialLinks from "./SocialLinks";
import type { SocialLinks as Links } from "@/lib/settings/schema";

export default function Footer({
  siteName,
  tagline,
  contactEmail,
  social,
}: {
  siteName: string;
  tagline: string;
  contactEmail: string;
  social: Links | null;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      {/* Main footer */}
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{tagline}</p>

            {/* Social links */}
            {social && (
              <div className="mt-6">
                <SocialLinks links={social} />
              </div>
            )}
          </div>

          {/* Explore — public surfaces only (commerce + auth surfaces are
              hidden during the content-first launch phase). */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Explore
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/blog" className="text-muted transition hover:text-accent">
                  Journal
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted transition hover:text-accent">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog/rss.xml" className="text-muted transition hover:text-accent">
                  RSS feed
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/privacy" className="text-muted transition hover:text-accent">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted transition hover:text-accent">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="text-muted transition hover:text-accent">
                  Impressum
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Stay Updated
            </p>
            <p className="mt-4 text-sm text-muted">
              New tutorials and deep dives, straight to your inbox. No spam, unsubscribe anytime.
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
            &copy; {year} {siteName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href={`mailto:${contactEmail}`} className="transition hover:text-accent">
              {contactEmail}
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

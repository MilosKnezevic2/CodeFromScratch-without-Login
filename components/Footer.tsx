import Link from "next/link";
import SubscribeForm from "./newsletter/SubscribeForm";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="text-lg font-bold text-foreground">
              Code<span className="gradient-text">FromScratch</span>
            </Link>
            <p className="text-sm text-muted">
              Master web development with hands-on tutorials, in-depth guides, and premium resources.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/blog" className="hover:text-accent transition">Blog</Link></li>
              <li><Link href="/ebooks" className="hover:text-accent transition">Ebooks</Link></li>
              <li><Link href="/courses" className="hover:text-accent transition">Courses</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition">Contact</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Account</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/login" className="hover:text-accent transition">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-accent transition">Sign Up</Link></li>
              <li><Link href="/dashboard" className="hover:text-accent transition">Dashboard</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Newsletter</h4>
            <p className="mb-3 text-sm text-muted">
              Get weekly updates delivered to your inbox.
            </p>
            <SubscribeForm />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {year} CodeFromScratch. All rights reserved.</p>
          <p>
            <a href="mailto:office@codefromscratch.org" className="hover:text-accent transition">
              office@codefromscratch.org
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

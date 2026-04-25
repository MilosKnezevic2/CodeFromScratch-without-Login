import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <p className="gradient-text text-7xl font-black">404</p>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="cta-glow rounded-lg px-6 py-2.5 text-sm font-semibold"
          >
            Go Home
          </Link>
          <Link
            href="/blog"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-accent/50 hover:text-foreground"
          >
            Browse Articles
          </Link>
        </div>
      </div>
    </div>
  );
}

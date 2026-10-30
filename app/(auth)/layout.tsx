import Link from "next/link";
import { requireAccounts } from "@/lib/surfaces";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sign-in and sign-up are a relaunch surface: a 404 until registration is switched on in Settings.
  await requireAccounts();
  return (
    <div className="flex min-h-[80dvh]">
      {/* Brand panel — hidden on mobile */}
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-accent/5 via-background to-accent-2/5 lg:flex">
        <div className="max-w-sm px-8 text-center">
          <Link href="/" className="inline-block">
            <span className="gradient-text text-3xl font-extrabold">
              CodeFromScratch
            </span>
          </Link>
          <p className="mt-4 text-lg font-semibold text-foreground">
            Master web development with hands-on tutorials
          </p>
          <p className="mt-2 text-sm text-muted">
            Join developers who are leveling up their skills with in-depth guides, premium resources, and a supportive community.
          </p>

          {/* Social proof */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">Free</p>
              <p>to start</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">10+</p>
              <p>articles</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">Pro</p>
              <p>content</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

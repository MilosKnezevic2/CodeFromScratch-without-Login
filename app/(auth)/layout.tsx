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
          <p className="mt-4 text-lg font-semibold text-foreground">Join the conversation under the articles</p>
          <p className="mt-2 text-sm text-muted">
            Ask a question, point out a mistake, share how you solved it. Reading stays free and needs no account.
          </p>

          <ul className="mt-8 space-y-2 text-left text-sm text-muted-foreground">
            <li>No password: Google or GitHub signs you in.</li>
            <li>Your email address is never shown.</li>
            <li>Delete your account and comments at any time.</li>
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

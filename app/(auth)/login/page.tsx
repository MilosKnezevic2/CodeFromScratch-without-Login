import type { Metadata } from "next";
import Link from "next/link";
import { safeCallbackPath } from "@/lib/auth-callback";
import ProviderButtons from "./ProviderButtons";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  AccessDenied: "Sign-in is not open right now, or this account cannot sign in.",
  OAuthAccountNotLinked:
    "This email address already belongs to an account that signs in another way. Use the provider you used the first time.",
  Configuration: "Sign-in is not available at the moment. Try again later.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const next = safeCallbackPath(callbackUrl);
  const message = error ? (ERRORS[error] ?? "Sign-in did not work. Try again.") : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        An account lets you comment under the articles. There is no password: you sign in with Google or GitHub, and we
        get your name, email address and profile picture from them, nothing else.
      </p>

      {message && (
        <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground">
          {message}
        </p>
      )}

      <div className="mt-6">
        <ProviderButtons callbackUrl={next} />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        By signing in you agree to the{" "}
        <Link href="/terms" className="text-accent underline underline-offset-2">
          terms
        </Link>
        . How your data is used, and how to delete your account, is in the{" "}
        <Link href="/privacy" className="text-accent underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}

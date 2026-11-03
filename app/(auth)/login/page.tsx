import type { Metadata } from "next";
import Link from "next/link";
import { safeCallbackPath } from "@/lib/auth-callback";
import EmailSignIn from "./EmailSignIn";
import ProviderButtons from "./ProviderButtons";

export const metadata: Metadata = {
  title: "Log in or sign up",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  AccessDenied: "Sign-in is not open right now, or this account cannot sign in.",
  OAuthAccountNotLinked:
    "This email address already belongs to an account that signs in another way. Use the way you signed in the first time.",
  Verification: "That sign-in link has expired or was already used. Ask for a new one below.",
  TooManyLinks: "Several links were sent to this address in the last half hour. Use the newest one, or try again later.",
  EmailSignin: "The sign-in email could not be sent. Check the address and try again.",
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
      <h1 className="text-2xl font-bold text-foreground">Log in or sign up</h1>
      <p className="mt-1 text-sm text-foreground">New here? The same buttons create your account; there is no separate sign-up form.</p>
      <p className="mt-2 text-sm text-muted">
        An account lets you comment, save articles into folders and keep track of your reading. There is no password: sign in with Google or GitHub, or with a
        link we email to you. We store your name, email address and profile picture, nothing else.
      </p>

      {message && (
        <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground">
          {message}
        </p>
      )}

      <div className="mt-6">
        <ProviderButtons callbackUrl={next} />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <EmailSignIn callbackUrl={next} />

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

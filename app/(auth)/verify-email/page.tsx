import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-sm text-center">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Verify Your Email</h1>
      <p className="text-muted">
        We&apos;ve sent a verification link to your email address. Please check your inbox
        and click the link to verify your account.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block text-sm text-indigo-600 hover:text-indigo-500"
      >
        Back to sign in
      </Link>
    </div>
  );
}

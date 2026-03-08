import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
      <p className="mt-2 text-muted">
        Thank you for your purchase. Your account has been upgraded.
      </p>
      <div className="mt-6 flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/blog"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2"
        >
          Browse Blog
        </Link>
      </div>
    </div>
  );
}

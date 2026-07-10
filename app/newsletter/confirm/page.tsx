import type { Metadata } from "next";
import Link from "next/link";
import NewsletterAction from "@/components/newsletter/NewsletterAction";

// Transactional page reached only from emails — keep it out of search results.
export const metadata: Metadata = {
  title: "Confirm subscription",
  robots: { index: false, follow: false },
};

export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const params = await searchParams;
  // Emails sent before the interstitial existed redirect here with ?status=
  // after the API already confirmed — keep honouring that shape.
  const legacySuccess = params.status === "success";

  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center px-4 text-center">
      {params.token ? (
        <NewsletterAction token={params.token} mode="confirm" />
      ) : legacySuccess ? (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Subscription confirmed!</h1>
          <p className="mt-2 text-muted">You&apos;re now subscribed to our newsletter.</p>
          <Link href="/" className="mt-6 text-sm text-accent hover:underline">
            Back to home
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-foreground">Invalid link</h1>
          <p className="mt-2 text-muted">
            This confirmation link is invalid or has expired.
          </p>
          <Link href="/" className="mt-6 text-sm text-accent hover:underline">
            Back to home
          </Link>
        </>
      )}
    </div>
  );
}

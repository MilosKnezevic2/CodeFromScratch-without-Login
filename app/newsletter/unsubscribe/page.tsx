import type { Metadata } from "next";
import Link from "next/link";
import NewsletterAction from "@/components/newsletter/NewsletterAction";

// Transactional page reached only from emails — keep it out of search results.
export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const params = await searchParams;
  // Emails sent before the interstitial existed redirect here with ?status=
  // after the API already acted — keep honouring that shape.
  const legacySuccess = params.status === "success";

  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center px-4 text-center">
      {params.token ? (
        <NewsletterAction token={params.token} mode="unsubscribe" />
      ) : legacySuccess ? (
        <>
          <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
          <p className="mt-2 text-muted">
            You have been unsubscribed from our newsletter.
          </p>
          <Link href="/" className="mt-6 text-sm text-accent hover:underline">
            Back to home
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-foreground">Invalid link</h1>
          <p className="mt-2 text-muted">This unsubscribe link is invalid.</p>
          <Link href="/" className="mt-6 text-sm text-accent hover:underline">
            Back to home
          </Link>
        </>
      )}
    </div>
  );
}

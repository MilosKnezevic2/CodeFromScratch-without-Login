import type { Metadata } from "next";
import Link from "next/link";
import NewsletterAction from "@/components/newsletter/NewsletterAction";

// Transactional page reached only from emails — keep it out of search results.
export const metadata: Metadata = {
  title: "Leave waitlist",
  robots: { index: false, follow: false },
};

export default async function CourseWaitlistUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center px-4 text-center">
      {token ? (
        <NewsletterAction token={token} mode="unsubscribe" kind="waitlist" />
      ) : (
        <>
          <h1 className="text-2xl font-bold text-foreground">Invalid link</h1>
          <p className="mt-2 text-muted">This link is invalid or has expired.</p>
          <Link href="/" className="mt-6 text-sm text-accent hover:underline">
            Back to home
          </Link>
        </>
      )}
    </div>
  );
}

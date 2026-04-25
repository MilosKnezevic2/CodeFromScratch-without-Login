import Link from "next/link";

export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const success = params.status === "success";

  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center text-center">
      {success ? (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Subscription Confirmed!</h1>
          <p className="mt-2 text-muted">
            You&apos;re now subscribed to our newsletter.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
          <p className="mt-2 text-muted">
            This confirmation link is invalid or has expired.
          </p>
        </>
      )}
      <Link href="/" className="mt-6 text-sm text-indigo-600 hover:text-indigo-500">
        Back to home
      </Link>
    </div>
  );
}

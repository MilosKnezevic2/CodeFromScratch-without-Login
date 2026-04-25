import Link from "next/link";

export default async function NewsletterUnsubscribePage({
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
          <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
          <p className="mt-2 text-muted">
            You have been unsubscribed from our newsletter.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-foreground">Error</h1>
          <p className="mt-2 text-muted">
            This unsubscribe link is invalid.
          </p>
        </>
      )}
      <Link href="/" className="mt-6 text-sm text-indigo-600 hover:text-indigo-500">
        Back to home
      </Link>
    </div>
  );
}

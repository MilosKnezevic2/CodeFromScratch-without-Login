import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-foreground">Checkout Canceled</h1>
      <p className="mt-2 text-muted">
        Your checkout was canceled. No charges were made.
      </p>
      <Link
        href="/pricing"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to Pricing
      </Link>
    </div>
  );
}

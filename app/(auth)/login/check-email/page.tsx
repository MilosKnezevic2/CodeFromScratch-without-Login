import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Check your inbox",
  robots: { index: false, follow: false },
};

export default function CheckEmailPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        We sent you a sign-in link. Open it on this device to sign in; it works once and for 30 minutes.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Nothing after a few minutes? Look in the spam or promotions folder, or{" "}
        <Link href="/login" className="text-accent underline underline-offset-2">
          ask for a new link
        </Link>
        .
      </p>
    </div>
  );
}

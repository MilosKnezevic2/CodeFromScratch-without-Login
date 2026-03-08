import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ManageSubscriptionButton from "@/components/stripe/ManageSubscriptionButton";

export default async function SubscriptionPage() {
  const user = await requireAuth();
  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const isPro = subscription?.plan === "PRO";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Subscription</h1>
          <p className="text-xs text-muted-foreground">Manage your plan and billing</p>
        </div>
      </div>

      <div className="max-w-lg rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Plan</p>
            <div className="mt-2 flex items-center gap-2.5">
              <p className="text-2xl font-extrabold text-foreground">{subscription?.plan || "FREE"}</p>
              {isPro && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent ring-1 ring-accent/20">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        {isPro && subscription?.currentPeriodEnd && (
          <div className="mt-5 rounded-xl border border-border bg-surface-2/30 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>
                {subscription.cancelAtPeriodEnd ? "Ends on " : "Next billing: "}
                <span className="font-medium text-foreground">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </span>
            </div>
          </div>
        )}

        <div className="mt-6">
          {isPro ? (
            <ManageSubscriptionButton />
          ) : (
            <Link href="/pricing" className="cta-glow inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Upgrade to Pro
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

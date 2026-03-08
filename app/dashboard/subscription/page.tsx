import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ManageSubscriptionButton from "@/components/stripe/ManageSubscriptionButton";

export default async function SubscriptionPage() {
  const user = await requireAuth();
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Subscription</h1>

      <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Current Plan</p>
            <p className="text-lg font-semibold text-foreground">
              {subscription?.plan || "FREE"}
              {subscription?.plan === "PRO" && (
                <span className="ml-2 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent ring-1 ring-accent/20">
                  Active
                </span>
              )}
            </p>
          </div>
        </div>

        {subscription?.plan === "PRO" && subscription?.currentPeriodEnd && (
          <div className="mt-4 space-y-2 text-sm text-muted">
            <p>
              {subscription.cancelAtPeriodEnd
                ? "Your subscription will end on "
                : "Next billing date: "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        <div className="mt-6">
          {subscription?.plan === "PRO" ? (
            <ManageSubscriptionButton />
          ) : (
            <Link
              href="/pricing"
              className="cta-glow inline-block rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

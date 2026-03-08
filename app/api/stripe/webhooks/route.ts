import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Helper to safely extract period dates from subscription
function getPeriodDates(subscription: Record<string, unknown>) {
  const start = subscription.current_period_start as number | undefined;
  const end = subscription.current_period_end as number | undefined;
  return {
    currentPeriodStart: start ? new Date(start * 1000) : null,
    currentPeriodEnd: end ? new Date(end * 1000) : null,
  };
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        if (session.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const sub = subscription as unknown as Record<string, unknown>;
          const { currentPeriodStart, currentPeriodEnd } = getPeriodDates(sub);

          await prisma.subscription.upsert({
            where: { userId },
            update: {
              plan: "PRO",
              status: "ACTIVE",
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              currentPeriodStart,
              currentPeriodEnd,
            },
            create: {
              userId,
              plan: "PRO",
              status: "ACTIVE",
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              currentPeriodStart,
              currentPeriodEnd,
            },
          });
        }

        if (session.mode === "payment" && session.metadata?.ebookId) {
          await prisma.ebookPurchase.create({
            data: {
              userId,
              ebookId: session.metadata.ebookId,
              stripePaymentIntentId: session.payment_intent as string,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const dbSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!dbSub) break;

        const statusMap: Record<string, "ACTIVE" | "CANCELED" | "PAST_DUE" | "INCOMPLETE"> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          incomplete: "INCOMPLETE",
        };

        const sub = subscription as unknown as Record<string, unknown>;
        const { currentPeriodStart, currentPeriodEnd } = getPeriodDates(sub);

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: statusMap[subscription.status] || "ACTIVE",
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodStart,
            currentPeriodEnd,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: "FREE",
            status: "CANCELED",
            stripeSubscriptionId: null,
            stripePriceId: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subId = invoice.subscription as string | undefined;
        if (subId) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: subId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

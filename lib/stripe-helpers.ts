import { stripe } from "./stripe";
import { prisma } from "./prisma";

export async function getOrCreateStripeCustomer(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function hasActiveSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  return subscription?.plan === "PRO" && subscription?.status === "ACTIVE";
}

export async function hasEbookAccess(userId: string, ebookId: string) {
  // Pro users with freeWithPro ebooks get access
  const isPro = await hasActiveSubscription(userId);
  if (isPro) {
    const ebook = await prisma.ebook.findUnique({ where: { id: ebookId } });
    if (ebook?.freeWithPro) return true;
  }

  // Check if user purchased the ebook
  const purchase = await prisma.ebookPurchase.findUnique({
    where: { userId_ebookId: { userId, ebookId } },
  });
  return !!purchase;
}

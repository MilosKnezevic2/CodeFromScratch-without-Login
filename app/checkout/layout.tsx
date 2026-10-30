import { requireCommerce } from "@/lib/surfaces";

/** Checkout pages are a relaunch surface: a 404 until payments are switched on in Settings. */
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  await requireCommerce();
  return children;
}

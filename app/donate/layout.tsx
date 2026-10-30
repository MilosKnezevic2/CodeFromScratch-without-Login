import { requireCommerce } from "@/lib/surfaces";

/** Donations are a relaunch surface: a 404 until payments are switched on in Settings. */
export default async function DonateLayout({ children }: { children: React.ReactNode }) {
  await requireCommerce();
  return children;
}

import { requireAccounts } from "@/lib/surfaces";

// Per author, never prerendered.
export const dynamic = "force-dynamic";

/** The editor uses the full width; the desk list stays in the dashboard. */
export default async function WriteLayout({ children }: { children: React.ReactNode }) {
  await requireAccounts();
  return children;
}

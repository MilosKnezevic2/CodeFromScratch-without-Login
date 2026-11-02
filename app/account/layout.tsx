import { requireAccounts } from "@/lib/surfaces";

// Per reader, never prerendered.
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireAccounts();
  return <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">{children}</div>;
}

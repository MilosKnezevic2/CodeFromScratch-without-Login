import { requireAccounts } from "@/lib/surfaces";
import DashboardNav from "./DashboardNav";

// Per reader, never prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAccounts();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <DashboardNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}

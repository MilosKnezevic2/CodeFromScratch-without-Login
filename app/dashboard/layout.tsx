import { redirect } from "next/navigation";
import { currentReader } from "@/lib/comments-store";
import { prisma } from "@/lib/prisma";
import { deskFolders } from "@/lib/reader/desk";
import { requireAccounts } from "@/lib/surfaces";
import DashboardSidebar from "./DashboardSidebar";

// Per reader, never prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAccounts();
  const reader = await currentReader();
  // The edge hook only sees that a cookie exists; an expired or deleted account lands here.
  if (!reader) redirect("/login?callbackUrl=/dashboard");
  const [folders, savedCount] = await Promise.all([deskFolders(reader.id), prisma.savedPost.count({ where: { userId: reader.id } })]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:flex lg:gap-10 lg:px-8 lg:pt-10">
      <DashboardSidebar folders={folders} savedCount={savedCount} />
      <div className="mt-6 min-w-0 flex-1 lg:mt-0">
        {children}
      </div>
    </div>
  );
}

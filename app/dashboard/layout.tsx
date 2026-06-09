import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MobileSidebarDrawer from "@/components/dashboard/MobileSidebarDrawer";

// Every dashboard page is per-user; none may be prerendered at build time
// (the build environment has no database).
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Top gradient bar */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Mobile navigation */}
        <div className="mb-6 md:hidden">
          <MobileSidebarDrawer />
        </div>

        <div className="flex gap-8">
          <aside className="hidden w-64 shrink-0 md:block">
            <div className="sticky top-28">
              <DashboardSidebar />
            </div>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

import AdminNavbar from "@/components/admin/AdminNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminNavbar />
      <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

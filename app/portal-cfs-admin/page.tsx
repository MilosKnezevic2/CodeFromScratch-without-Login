import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import StatsCard from "@/components/admin/StatsCard";

export const metadata = {
  title: "Admin Dashboard | CodeFromScratch",
};

export default async function AdminPage() {
  await requireAdmin();

  const [
    totalUsers,
    proUsers,
    subscribers,
    contacts,
    ebooks,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
    prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    prisma.contactSubmission.count({ where: { read: false } }),
    prisma.ebook.count({ where: { published: true } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Users" value={totalUsers} />
        <StatsCard label="Pro Subscribers" value={proUsers} />
        <StatsCard label="Newsletter Subscribers" value={subscribers} />
        <StatsCard label="Unread Messages" value={contacts} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Recent Signups
        </h2>
        {recentUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-foreground">
                    {user.name || "Unnamed"}
                  </span>
                  <span className="ml-2 text-muted">{user.email}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

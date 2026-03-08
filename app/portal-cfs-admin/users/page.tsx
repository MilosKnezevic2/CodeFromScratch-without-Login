import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.q || "";
  const limit = 20;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { subscription: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Users ({total})</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search users..."
            className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-accent focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-surface-3 px-3 py-1.5 text-sm text-muted hover:bg-surface-2">
            Search
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-4 py-2 font-medium text-muted">Name</th>
              <th className="px-4 py-2 font-medium text-muted">Email</th>
              <th className="px-4 py-2 font-medium text-muted">Role</th>
              <th className="px-4 py-2 font-medium text-muted">Plan</th>
              <th className="px-4 py-2 font-medium text-muted">Joined</th>
              <th className="px-4 py-2 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-surface-2/50">
                <td className="px-4 py-2 text-foreground">
                  {user.name || "—"}
                  {user.banned && (
                    <span className="ml-1 text-xs text-red-400">(Banned)</span>
                  )}
                </td>
                <td className="px-4 py-2 text-muted">{user.email}</td>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-purple-400/10 text-purple-400"
                      : "bg-surface-3 text-muted"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    user.subscription?.plan === "PRO"
                      ? "bg-accent/10 text-accent"
                      : "bg-surface-3 text-muted"
                  }`}>
                    {user.subscription?.plan || "FREE"}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/portal-cfs-admin/users/${user.id}`}
                    className="text-xs text-accent hover:text-accent-2"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/portal-cfs-admin/users?page=${page - 1}&q=${search}`} className="rounded border border-border px-3 py-1 text-sm text-muted hover:text-foreground">
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          {page < pages && (
            <Link href={`/portal-cfs-admin/users?page=${page + 1}&q=${search}`} className="rounded border border-border px-3 py-1 text-sm text-muted hover:text-foreground">
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

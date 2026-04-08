import AdminUsersList from "@/components/admin/AdminUsersList";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.$queryRaw<Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    banned: boolean;
    createdAt: Date;
    plan: string | null;
  }>>`
    SELECT u.id, u.name, u.email, u.image, u.role, u.banned, u."createdAt", s.plan
    FROM "User" u
    LEFT JOIN "Subscription" s ON s."userId" = u.id
    ORDER BY u."createdAt" DESC
    LIMIT 500
  `;

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    plan: u.plan || "FREE",
  }));

  return <AdminUsersList users={serialized} />;
}

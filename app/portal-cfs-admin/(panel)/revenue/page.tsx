import { prisma } from "@/lib/prisma";
import KPICard from "@/components/admin/KPICard";
import Badge from "@/components/admin/Badge";

const PRO_MONTHLY_PRICE = 9;
const PRO_PLUS_MONTHLY_PRICE = 19;

export default async function AdminRevenuePage() {
  const [proCount, proPlusCount, canceledCount, ebookPurchases, ebooks, recentSubs] = await Promise.all([
    prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
    prisma.subscription.count({ where: { plan: "PRO_PLUS", status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "CANCELED" } }),
    prisma.ebookPurchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { email: true, name: true } }, ebook: { select: { title: true, price: true } } },
    }),
    prisma.ebook.findMany({
      select: { title: true, price: true, _count: { select: { purchases: true } } },
    }),
    prisma.subscription.findMany({
      where: { plan: { not: "FREE" } },
      orderBy: { updatedAt: "desc" },
      take: 15,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  const mrr = (proCount * PRO_MONTHLY_PRICE) + (proPlusCount * PRO_PLUS_MONTHLY_PRICE);
  const arr = mrr * 12;
  const totalActiveSubs = proCount + proPlusCount;
  const churnRate = totalActiveSubs + canceledCount > 0
    ? Math.round((canceledCount / (totalActiveSubs + canceledCount)) * 100)
    : 0;
  const ebookRevenue = ebooks.reduce((sum, e) => sum + (e.price * e._count.purchases) / 100, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Revenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Financial overview</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="MRR" value={mrr} prefix="$" />
        <KPICard label="ARR" value={arr} prefix="$" />
        <KPICard label="Active Subscribers" value={totalActiveSubs} />
        <KPICard label="Churn Rate" value={`${churnRate}%`} />
      </div>

      {/* Subscription breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subscriptions</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PRO (${PRO_MONTHLY_PRICE}/mo)</span>
              <span className="text-sm font-bold text-foreground">{proCount} active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PRO+ (${PRO_PLUS_MONTHLY_PRICE}/mo)</span>
              <span className="text-sm font-bold text-foreground">{proPlusCount} active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Canceled</span>
              <span className="text-sm font-bold text-red-400">{canceledCount}</span>
            </div>
          </div>
        </div>

        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ebook Sales</h3>
          <p className="mt-2 text-2xl font-extrabold text-foreground">${ebookRevenue.toFixed(2)}</p>
          <div className="mt-4 space-y-2">
            {ebooks.map((e) => (
              <div key={e.title} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground">{e.title}</span>
                <span className="font-medium text-foreground">{e._count.purchases} sold</span>
              </div>
            ))}
            {ebooks.length === 0 && <p className="text-sm text-muted-foreground">No ebooks yet</p>}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="glow-border overflow-hidden rounded-xl bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Subscription Activity</h3>
        </div>
        <div className="divide-y divide-border">
          {recentSubs.map((sub) => (
            <div key={sub.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {(sub.user.name || sub.user.email).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{sub.user.name || sub.user.email}</p>
                <p className="text-xs text-muted-foreground">{sub.user.email}</p>
              </div>
              <Badge variant={sub.plan.toLowerCase().replace("_", "-")}>{sub.plan}</Badge>
              <Badge variant={sub.status.toLowerCase()}>{sub.status}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(sub.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </span>
            </div>
          ))}
          {recentSubs.length === 0 && (
            <div className="px-5 py-12 text-center text-muted-foreground">No subscription activity yet</div>
          )}
        </div>
      </div>

      {/* Recent ebook purchases */}
      {ebookPurchases.length > 0 && (
        <div className="glow-border overflow-hidden rounded-xl bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Ebook Purchases</h3>
          </div>
          <div className="divide-y divide-border">
            {ebookPurchases.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{p.ebook.title}</p>
                  <p className="text-xs text-muted-foreground">{p.user.name || p.user.email}</p>
                </div>
                <span className="text-sm font-bold text-accent">${(p.ebook.price / 100).toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

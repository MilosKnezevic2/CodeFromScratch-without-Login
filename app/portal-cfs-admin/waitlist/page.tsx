import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { WAITLIST_LEVELS } from "@/lib/course-waitlist";

export const metadata: Metadata = {
  title: "Waitlist",
  robots: { index: false, follow: false },
};

const when = (value: Date) =>
  value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Who asked to hear when the course opens, at which level, and what they
 * wrote. Only confirmed addresses count: an unconfirmed sign-up is not
 * consent and is deleted after the confirmation window.
 */
export default async function AdminWaitlistPage() {
  const people = await prisma.courseWaitlist
    .findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, confirmed: true, level: true, note: true, createdAt: true },
    })
    .catch((error: unknown) => {
      console.error("Waitlist could not be read:", error);
      return null;
    });

  if (!people) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Waitlist</h1>
        <p className="text-muted">The database did not answer. It may be waking up; reload in a minute.</p>
      </div>
    );
  }

  const confirmed = people.filter((p) => p.confirmed);
  const pending = people.length - confirmed.length;
  const byLevel = WAITLIST_LEVELS.map((level) => ({
    level,
    count: confirmed.filter((p) => p.level === level).length,
  }));
  const top = Math.max(1, ...byLevel.map((l) => l.count));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Waitlist</h1>
          <p className="mt-1 text-sm text-muted">
            People who asked for one email when the course opens. Ebooks have no waitlist yet: their page is hidden until
            selling starts.
          </p>
        </div>
        {people.length > 0 && (
          <a
            href="/api/admin/waitlist/export"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/40"
          >
            Download CSV
          </a>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course, confirmed</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{confirmed.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Waiting for confirmation</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{pending}</p>
          <p className="mt-1 text-xs text-muted-foreground">Not counted until they click the link.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level, confirmed only</p>
          <ul className="mt-3 space-y-2">
            {byLevel.map(({ level, count }) => (
              <li key={level} className="text-sm">
                <div className="flex justify-between text-foreground">
                  <span className="capitalize">{level}</span>
                  <span className="tabular-nums">{count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface-2" aria-hidden="true">
                  <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(count / top) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {people.length === 0 ? (
        <p className="text-muted">Nobody has signed up yet. The form is at /course-waitlist.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold">Level</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Note</th>
                <th scope="col" className="px-4 py-3 font-semibold">Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {people.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{p.email}</td>
                  <td className="px-4 py-3 capitalize text-muted">{p.level}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        p.confirmed ? "bg-emerald-500/20 text-foreground" : "bg-surface-2 text-muted-foreground"
                      }`}
                    >
                      {p.confirmed ? "Confirmed" : "Pending"}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted">{p.note || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{when(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        To remove one person everywhere (newsletter, waitlist, messages), use Settings → Data and privacy.
      </p>
    </div>
  );
}

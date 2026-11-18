import type { Metadata } from "next";
import Link from "next/link";
import KPICard from "@/components/admin/KPICard";
import ComposeLetter, { type PostOption } from "@/components/admin/newsletter/ComposeLetter";
import RemoveSubscriberButton from "@/components/admin/newsletter/RemoveSubscriberButton";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getPostsAdvanced } from "@/lib/sanity/queries";

export const metadata: Metadata = {
  title: "Newsletter",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 25;
const BASE = "/portal-cfs-admin/newsletter";

type Tab = "subscribers" | "compose" | "history";
type StatusFilter = "all" | "confirmed" | "pending";

const TABS: { id: Tab; label: string }[] = [
  { id: "subscribers", label: "Subscribers" },
  { id: "compose", label: "Write a letter" },
  { id: "history", label: "Sent letters" },
];

const formatDate = (value: Date | null) =>
  value
    ? value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const STATUS_STYLE: Record<string, string> = {
  SENT: "bg-emerald-500/15 text-emerald-400",
  SENDING: "bg-accent/15 text-accent",
  PARTIAL: "bg-amber-500/15 text-amber-400",
  FAILED: "bg-red-500/15 text-red-400",
};

function subscribersHref(status: StatusFilter, q: string, page: number) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${BASE}?${query}` : BASE;
}

async function SubscribersTab({ status, q, page }: { status: StatusFilter; q: string; page: number }) {
  const where: Prisma.NewsletterSubscriberWhereInput = {
    ...(status === "confirmed" ? { confirmed: true } : {}),
    ...(status === "pending" ? { confirmed: false } : {}),
    ...(q ? { email: { contains: q, mode: "insensitive" as const } } : {}),
  };
  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, email: true, confirmed: true, createdAt: true, confirmedAt: true },
    }),
    prisma.newsletterSubscriber.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section aria-label="Subscribers" className="space-y-4">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <label htmlFor="subscriber-search" className="block text-sm font-medium text-muted">
            Search by email
          </label>
          <input
            id="subscriber-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="name@example.com"
            className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="subscriber-status" className="block text-sm font-medium text-muted">
            Status
          </label>
          <select
            id="subscriber-status"
            name="status"
            defaultValue={status}
            className="mt-1 block min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Waiting for confirmation</option>
          </select>
        </div>
        <button type="submit" className="min-h-11 rounded-lg gradient-btn px-4 py-2 text-sm font-medium transition">
          Filter
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
        <a
          href="/api/admin/newsletter/subscribers/export"
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2"
        >
          Download CSV
        </a>
      </form>

      {subscribers.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="font-medium text-foreground">
            {q || status !== "all" ? "Nobody matches this filter." : "Nobody has subscribed yet."}
          </p>
          <p className="mt-1 text-sm text-muted">
            {q || status !== "all" ? (
              <Link href={BASE} className="text-accent underline underline-offset-2">
                Show everyone
              </Link>
            ) : (
              "New sign-ups from the site appear here."
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Signed up</th>
                <th scope="col" className="px-4 py-3 font-semibold">Confirmed</th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-border/60 last:border-0">
                  <td className="break-all px-4 py-3 font-medium text-foreground">{subscriber.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${
                        subscriber.confirmed
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {subscriber.confirmed ? "Confirmed" : "Waiting"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(subscriber.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(subscriber.confirmedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <RemoveSubscriberButton id={subscriber.id} email={subscriber.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Subscriber pages" className="flex items-center justify-between text-sm text-muted">
          {page > 1 ? (
            <Link href={subscribersHref(status, q, page - 1)} className="inline-flex min-h-11 items-center text-accent">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={subscribersHref(status, q, page + 1)} className="inline-flex min-h-11 items-center text-accent">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}

async function ComposeTab({ confirmed }: { confirmed: number }) {
  const { posts } = await getPostsAdvanced({ page: 1, limit: 100, sort: "newest" }).catch(() => ({
    posts: [],
  }));
  const options: PostOption[] = posts.map((post) => ({
    slug: post.slug.current,
    title: post.title,
    excerpt: post.excerpt ?? "",
  }));
  return <ComposeLetter posts={options} confirmedCount={confirmed} />;
}

async function HistoryTab() {
  const campaigns = await prisma.newsletterCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      recipientCount: true,
      sentCount: true,
      failedCount: true,
      sentAt: true,
      createdAt: true,
    },
  });

  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="font-medium text-foreground">No letters have been sent yet.</p>
        <p className="mt-1 text-sm text-muted">
          <Link href={`${BASE}?tab=compose`} className="text-accent underline underline-offset-2">
            Write the first one
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Subject</th>
            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            <th scope="col" className="px-4 py-3 font-semibold">Sent</th>
            <th scope="col" className="px-4 py-3 font-semibold">Failed</th>
            <th scope="col" className="px-4 py-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{campaign.subject}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[campaign.status] ?? "bg-surface-2 text-muted"}`}
                >
                  {campaign.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {campaign.sentCount}
                {campaign.recipientCount > 0 ? ` of ${campaign.recipientCount}` : ""}
              </td>
              <td className="px-4 py-3 text-muted">{campaign.failedCount}</td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {formatDate(campaign.sentAt ?? campaign.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const tab: Tab = params.tab === "compose" || params.tab === "history" ? params.tab : "subscribers";
  const status: StatusFilter =
    params.status === "confirmed" || params.status === "pending" ? params.status : "all";
  const q = (params.q ?? "").trim().slice(0, 254);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [confirmed, pending, sentLetters] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    prisma.newsletterSubscriber.count({ where: { confirmed: false } }),
    prisma.newsletterCampaign.count({ where: { sentAt: { not: null } } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard label="Confirmed subscribers" value={confirmed} />
        <KPICard label="Waiting for confirmation" value={pending} />
        <KPICard label="Letters sent" value={sentLetters} />
      </div>

      <nav aria-label="Newsletter sections" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none]">
        {TABS.map(({ id, label }) => (
          <Link
            key={id}
            href={id === "subscribers" ? BASE : `${BASE}?tab=${id}`}
            aria-current={tab === id ? "page" : undefined}
            className={`-mb-px inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-4 text-sm font-medium transition ${
              tab === id
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "subscribers" && <SubscribersTab status={status} q={q} page={page} />}
      {tab === "compose" && <ComposeTab confirmed={confirmed} />}
      {tab === "history" && <HistoryTab />}
    </div>
  );
}

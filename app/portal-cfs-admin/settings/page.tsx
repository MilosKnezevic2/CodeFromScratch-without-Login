import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import DataPanel from "@/components/admin/settings/DataPanel";
import RefreshCacheButton from "@/components/admin/settings/RefreshCacheButton";
import SectionForm from "@/components/admin/settings/SectionForm";
import SecurityPanel from "@/components/admin/settings/SecurityPanel";
import { getAdminState } from "@/lib/admin-auth";
import { readAdminSession } from "@/lib/admin-session";
import { listAudit, type AuditEntry } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { flatten, SECTION_INFO, SECTIONS, stripeKeyMode, type Section } from "@/lib/settings/schema";
import { loadSettings } from "@/lib/settings/store";
import { saveSettingsAction } from "./actions";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

const BASE = "/portal-cfs-admin/settings";

type Tab = Section | "security" | "data" | "system";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "seo", label: "SEO" },
  { id: "newsletter", label: "Newsletter" },
  { id: "features", label: "Features" },
  { id: "analytics", label: "Goals" },
  { id: "payments", label: "Payments" },
  { id: "security", label: "Security" },
  { id: "data", label: "Data and privacy" },
  { id: "system", label: "System" },
];

const DASHBOARDS = [
  { label: "Vercel (hosting, DNS, variables)", href: "https://vercel.com/milosknezevic2s-projects/codefromscratch" },
  { label: "Sanity (articles)", href: "https://www.sanity.io/manage/project/jkgmggst" },
  { label: "Resend (email)", href: "https://resend.com/emails" },
  { label: "Supabase (database)", href: "https://supabase.com/dashboard" },
  { label: "Stripe (payments)", href: "https://dashboard.stripe.com" },
  { label: "GitHub (code)", href: "https://github.com/MilosKnezevic2/CodeFromScratch-without-Login" },
];

const ACTION_LABELS: Record<string, string> = {
  "login.success": "Signed in",
  "login.failed": "Failed sign-in",
  logout: "Signed out",
  "settings.saved": "Settings saved",
  "password.changed": "Password changed",
  "password.change-failed": "Password change refused",
  "username.changed": "Username changed",
  "mfa.enabled": "Two-step login switched on",
  "mfa.disabled": "Two-step login switched off",
  "cache.refreshed": "Public site refreshed",
  "person.looked-up": "Reader data searched",
  "person.exported": "Reader data copied",
  "person.erased": "Reader data deleted",
};

const when = (value: Date) =>
  value.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function describe(entry: AuditEntry): string {
  const detail = entry.detail ?? {};
  const parts: string[] = [];
  if (typeof detail.section === "string") parts.push(detail.section);
  if (Array.isArray(detail.changed) && detail.changed.length > 0) parts.push(detail.changed.join(", "));
  if (typeof detail.reason === "string") parts.push(detail.reason);
  if (detail.mfa === true) parts.push("with code");
  if (typeof detail.ref === "string") parts.push(`ref ${detail.ref}`);
  return parts.join(" · ");
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${ok ? "bg-emerald-500/20 text-foreground" : "bg-surface-2 text-muted-foreground"}`}>
      {label}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}

async function PaymentsStatus() {
  const mode = stripeKeyMode(process.env.STRIPE_SECRET_KEY);
  const [ebooks, subscriptions] = await Promise.all([
    prisma.ebook.count({ where: { published: true } }).catch(() => 0),
    prisma.subscription.count({ where: { status: "ACTIVE", plan: { not: "FREE" } } }).catch(() => 0),
  ]);
  return (
    <div className="glow-border rounded-xl bg-surface p-5">
      <h3 className="text-sm font-semibold text-foreground">What is in place</h3>
      <div className="mt-2">
        <Row label="Stripe secret key">
          <Status ok={mode !== "none"} label={mode === "live" ? "Live key" : mode === "test" ? "Test key" : "Not set"} />
        </Row>
        <Row label="Stripe webhook secret">
          <Status ok={Boolean(process.env.STRIPE_WEBHOOK_SECRET)} label={process.env.STRIPE_WEBHOOK_SECRET ? "Set" : "Not set"} />
        </Row>
        <Row label="Subscription price IDs">
          <Status
            ok={Boolean(process.env.STRIPE_PRO_MONTHLY_PRICE_ID && process.env.STRIPE_PRO_ANNUAL_PRICE_ID)}
            label={process.env.STRIPE_PRO_MONTHLY_PRICE_ID && process.env.STRIPE_PRO_ANNUAL_PRICE_ID ? "Set" : "Not set"}
          />
        </Row>
        <Row label="Published ebooks">{ebooks}</Row>
        <Row label="Paying subscribers">{subscriptions}</Row>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Keys live on Vercel, not here. Checkout, the pricing page and the Stripe webhook already exist in the code and stay closed while
        &quot;Accept payments&quot; is off.
      </p>
    </div>
  );
}

async function SystemTab() {
  const checks: { label: string; ok: boolean; note: string }[] = [
    { label: "Email sending (Resend)", ok: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), note: "newsletter, confirmations, contact form" },
    { label: "Articles (Sanity)", ok: Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID), note: "the CMS behind every article" },
    { label: "Cache refresh from Sanity", ok: Boolean(process.env.SANITY_REVALIDATE_SECRET), note: "published articles appear without a redeploy" },
    { label: "Daily cron protected", ok: Boolean(process.env.CRON_SECRET), note: "keeps the database awake, deletes unconfirmed sign-ups" },
    { label: "Error tracking (Sentry)", ok: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN), note: "optional" },
    { label: "Comments (Giscus)", ok: Boolean(process.env.NEXT_PUBLIC_GISCUS_REPO_ID && process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID), note: "optional; needed before comments can be switched on" },
    { label: "Payments (Stripe)", ok: Boolean(process.env.STRIPE_SECRET_KEY), note: "see the Payments tab" },
  ];
  let database: string;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "Reachable";
  } catch {
    database = "Unreachable";
  }
  const commit = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? "").slice(0, 7);
  const audit = await listAudit(50);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">System</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">What is connected, and a record of everything done in this portal.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-sm font-semibold text-foreground">Connections</h3>
          <div className="mt-2">
            {checks.map((check) => (
              <Row key={check.label} label={check.label}>
                <span className="inline-flex flex-col items-end gap-0.5">
                  <Status ok={check.ok} label={check.ok ? "Connected" : "Not set"} />
                  <span className="text-xs font-normal text-muted-foreground">{check.note}</span>
                </span>
              </Row>
            ))}
            <Row label="Database">
              <Status ok={database === "Reachable"} label={database} />
            </Row>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glow-border rounded-xl bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">This deployment</h3>
            <div className="mt-2">
              <Row label="Environment">{process.env.VERCEL_ENV ?? process.env.NODE_ENV}</Row>
              <Row label="Code version">{commit ? <code className="font-mono">{commit}</code> : "local"}</Row>
            </div>
            <div className="mt-4">
              <RefreshCacheButton />
            </div>
          </div>
          <div className="glow-border rounded-xl bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Other dashboards</h3>
            <ul className="mt-2 space-y-1">
              {DASHBOARDS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-accent underline-offset-2 hover:underline">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <section aria-label="Activity log" className="glow-border overflow-x-auto rounded-xl bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Activity log</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">The last 50 actions and sign-in attempts. Failed sign-ins you do not recognise mean someone is guessing.</p>
        </div>
        {audit.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-2 font-semibold">When</th>
                <th scope="col" className="px-3 py-2 font-semibold">What</th>
                <th scope="col" className="px-3 py-2 font-semibold">Details</th>
                <th scope="col" className="px-5 py-2 font-semibold">From</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((entry) => (
                <tr key={entry.id} className="border-t border-border/60">
                  <td className="whitespace-nowrap px-5 py-2 text-muted-foreground">{when(entry.createdAt)}</td>
                  <td className={`px-3 py-2 font-medium ${entry.action === "login.failed" ? "text-red-400" : "text-foreground"}`}>
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{describe(entry)}</td>
                  <td className="whitespace-nowrap px-5 py-2 font-mono text-xs text-muted-foreground">{entry.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requested } = await searchParams;
  const tab: Tab = TABS.some((t) => t.id === requested) ? (requested as Tab) : "general";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none]">
        {TABS.map(({ id, label }) => (
          <Link
            key={id}
            href={id === "general" ? BASE : `${BASE}?tab=${id}`}
            aria-current={tab === id ? "page" : undefined}
            className={`-mb-px inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-4 text-sm font-medium transition ${
              tab === id ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {SECTIONS.includes(tab as Section) && <SettingsTab section={tab as Section} />}
      {tab === "security" && <SecurityTab />}
      {tab === "data" && <DataPanel />}
      {tab === "system" && <SystemTab />}
    </div>
  );
}

async function SettingsTab({ section }: { section: Section }) {
  const settings = await loadSettings();
  const info = SECTION_INFO[section];
  return (
    <SectionForm
      title={info.title}
      description={info.description}
      fields={info.fields}
      values={flatten(settings[section])}
      action={saveSettingsAction.bind(null, section)}
      before={section === "payments" ? <PaymentsStatus /> : undefined}
    />
  );
}

async function SecurityTab() {
  const [state, session] = await Promise.all([getAdminState(), readAdminSession((await cookies()).get("cfs-admin-token")?.value)]);
  return <SecurityPanel state={state} session={{ issuedAt: session?.issuedAt ?? null, expiresAt: session?.expiresAt ?? null }} />;
}

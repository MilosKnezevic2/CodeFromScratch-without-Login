import { prisma } from "@/lib/prisma";
import { SITE_CONFIG, SOCIAL_LINKS } from "@/lib/config";

export default async function AdminSettingsPage() {
  const [userCount, postViewCount, subscriberCount, ebookCount] = await Promise.all([
    prisma.user.count(),
    prisma.postView.count(),
    prisma.newsletterSubscriber.count(),
    prisma.ebook.count(),
  ]);

  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSanity = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const hasPlausible = !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const env = process.env.NODE_ENV;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">System configuration and health</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Site config */}
        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Site</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{SITE_CONFIG.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium text-foreground">{SITE_CONFIG.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium text-foreground">{SITE_CONFIG.location}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Environment</span><span className={`font-bold ${env === "production" ? "text-green-400" : "text-yellow-400"}`}>{env}</span></div>
          </div>
        </div>

        {/* Integrations */}
        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Integrations</h3>
          <div className="mt-4 space-y-3 text-sm">
            {[
              { name: "Stripe", ok: hasStripe },
              { name: "Resend Email", ok: hasResend },
              { name: "Sanity CMS", ok: hasSanity },
              { name: "Plausible Analytics", ok: hasPlausible },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-muted-foreground">{s.name}</span>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${s.ok ? "text-green-400" : "text-red-400"}`}>
                  <span className={`h-2 w-2 rounded-full ${s.ok ? "bg-green-400" : "bg-red-400"}`} />
                  {s.ok ? "Connected" : "Not configured"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Social Links</h3>
          <div className="mt-4 space-y-3 text-sm">
            {Object.entries(SOCIAL_LINKS).map(([key, url]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-muted-foreground capitalize">{key}</span>
                <span className={`text-xs font-medium ${url ? "text-accent" : "text-muted-foreground"}`}>
                  {url ? "Set" : "Not set"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Database stats */}
        <div className="glow-border rounded-xl bg-surface p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Database</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Users</span><span className="font-medium text-foreground">{userCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Post views tracked</span><span className="font-medium text-foreground">{postViewCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Newsletter subscribers</span><span className="font-medium text-foreground">{subscriberCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ebooks</span><span className="font-medium text-foreground">{ebookCount}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

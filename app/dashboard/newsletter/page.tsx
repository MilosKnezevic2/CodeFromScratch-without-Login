import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function NewsletterPage() {
  const user = await requireAuth();
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Newsletter</h1>
          <p className="text-xs text-muted-foreground">Manage your email subscription</p>
        </div>
      </div>

      <div className="max-w-lg rounded-2xl border border-border bg-surface p-6">
        {subscriber ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${subscriber.confirmed ? "bg-accent/10" : "bg-yellow-500/10"}`}>
                {subscriber.confirmed ? (
                  <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {subscriber.confirmed ? "Subscribed" : "Awaiting Confirmation"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscriber.confirmed ? "You're receiving weekly updates" : "Check your inbox for the confirmation email"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/30 p-4">
              <div className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground">{subscriber.email}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
              <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Not subscribed yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Subscribe from the footer of any page to get weekly tutorials.</p>
          </div>
        )}
      </div>
    </div>
  );
}

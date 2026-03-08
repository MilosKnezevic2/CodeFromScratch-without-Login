import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function NewsletterPage() {
  const user = await requireAuth();

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>

      <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur-xl p-6">
        {subscriber ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${subscriber.confirmed ? "bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.5)]" : "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]"}`} />
              <p className="text-sm text-muted">
                {subscriber.confirmed ? "Subscribed and confirmed" : "Awaiting confirmation"}
              </p>
            </div>
            <p className="text-sm text-muted">
              Subscribed email: {subscriber.email}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              You are not subscribed to our newsletter yet.
            </p>
            <p className="text-sm text-muted">
              Subscribe from the footer of any page to get weekly updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

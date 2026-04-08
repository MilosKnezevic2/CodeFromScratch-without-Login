import { prisma } from "@/lib/prisma";

export default async function AdminContactsPage() {
  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Contact Messages ({submissions.length})
      </h1>

      {submissions.length === 0 ? (
        <p className="text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className={`rounded-xl border p-4 ${
                sub.read ? "border-border bg-surface" : "border-accent/30 bg-teal-400/5"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{sub.name}</p>
                  <p className="text-sm text-muted">{sub.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!sub.read && (
                    <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      New
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted">{sub.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

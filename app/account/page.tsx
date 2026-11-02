import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DeleteAccount from "./DeleteAccount";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

const PROVIDER_NAMES: Record<string, string> = { google: "Google", github: "GitHub", resend: "Email link" };

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "published",
  PENDING: "waiting for approval",
  REJECTED: "not published",
  SPAM: "not published",
};

export default async function AccountPage() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
      createdAt: true,
      accounts: { select: { provider: true } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, postSlug: true, body: true, status: true },
      },
    },
  });
  if (!user) redirect("/login?callbackUrl=/account");

  const providers = user.accounts.map((a) => PROVIDER_NAMES[a.provider] ?? a.provider).join(", ") || "Email link";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Your account</h1>
        <p className="mt-2 text-sm text-muted">Everything this site stores about you, and how to remove it.</p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-bold text-foreground">What we store</h2>
        <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="text-foreground">{user.name ?? "—"}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="break-all text-foreground">{user.email}</dd>
          <dt className="text-muted-foreground">Signs in with</dt>
          <dd className="text-foreground">{providers}</dd>
          <dt className="text-muted-foreground">Member since</dt>
          <dd className="text-foreground">
            {user.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </dd>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Your name and picture are shown next to your comments; your email address is never shown. Details are in the{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-bold text-foreground">Your comments ({user.comments.length})</h2>
        {user.comments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No comments yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {user.comments.map((c) => (
              <li key={c.id} className="text-sm">
                <Link href={`/blog/${c.postSlug}#comments`} className="font-medium text-accent underline-offset-2 hover:underline">
                  {c.postSlug}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">{STATUS_LABEL[c.status] ?? c.status}</span>
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-muted">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-red-500/30 p-6">
        <h2 className="text-lg font-bold text-foreground">Delete your account</h2>
        <DeleteAccount />
      </section>
    </div>
  );
}

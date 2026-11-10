import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionCard } from "../_ui/parts";
import TrackingControls from "../reading/TrackingControls";
import DeleteAccount from "./DeleteAccount";
import { isUploadedAvatar } from "@/lib/reader/avatar";
import { AvatarPicker, EmailChoices, GoalPicker, NameForm } from "./ProfileForms";

export const metadata: Metadata = {
  title: "Profile and settings",
  robots: { index: false, follow: false },
};

const PROVIDERS = [
  { id: "github", name: "GitHub" },
  { id: "google", name: "Google" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "published",
  PENDING: "waiting for approval",
  REJECTED: "not published",
  SPAM: "not published",
};

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "goal", label: "Reading goal" },
  { id: "email", label: "Email" },
  { id: "sign-in", label: "How you sign in" },
  { id: "comments", label: "Your comments" },
  { id: "data", label: "Privacy and your data" },
  { id: "delete", label: "Delete account" },
];

export default async function ProfilePage() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login?callbackUrl=/dashboard/account");

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      weeklyGoal: true,
      notifyReplies: true,
      weeklyReminder: true,
      trackReading: true,
      accounts: { select: { provider: true } },
      _count: { select: { readingHistory: true } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, postSlug: true, body: true, status: true },
      },
    },
  });
  if (!user) redirect("/login?callbackUrl=/dashboard/account");
  const subscriber = await prisma.newsletterSubscriber.findFirst({
    where: { OR: [{ userId: id }, { email: user.email.toLowerCase() }], confirmed: true },
    select: { unsubscribeToken: true },
  });
  const linked = new Set(user.accounts.map((a) => a.provider));
  const initial = (user.name ?? user.email).trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Profile and settings</h1>
        <nav aria-label="On this page" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-border px-3.5 text-sm text-muted transition hover:text-foreground">
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      <SectionCard className="scroll-mt-28">
        <div id="profile" className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <AvatarPicker image={user.image} initial={initial} uploaded={isUploadedAvatar(user.image)} />
          <div className="min-w-0 flex-1 space-y-4">
            <h2 className="text-lg font-extrabold text-foreground">Profile</h2>
            <NameForm name={user.name ?? ""} />
            <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="inline text-muted">Email </dt>
                <dd className="inline break-all font-bold text-foreground">{user.email}</dd>
              </div>
              <div>
                <dt className="inline text-muted">Member since </dt>
                <dd className="inline font-bold text-foreground">{user.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
              </div>
            </dl>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="scroll-mt-28">
        <div id="goal">
          <h2 className="text-lg font-extrabold text-foreground">Reading goal</h2>
          <p className="mt-1 text-sm text-muted">Articles a week. Reach it and the week counts toward your streak. Weeks start on Monday.</p>
          <GoalPicker goal={user.weeklyGoal} />
        </div>
      </SectionCard>

      <SectionCard className="scroll-mt-28">
        <div id="email">
          <h2 className="text-lg font-extrabold text-foreground">Email</h2>
          <p className="mt-1 text-sm text-muted">
            Sent to <span className="break-all text-foreground">{user.email}</span>. Each one is off until you turn it on, and every email has a link to turn it off.
          </p>
          <EmailChoices
            email={user.email}
            newsletterUnsubscribe={subscriber ? `/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}` : null}
            replies={user.notifyReplies}
            reminder={user.weeklyReminder}
          />
        </div>
      </SectionCard>

      <SectionCard className="scroll-mt-28">
        <div id="sign-in">
          <h2 className="text-lg font-extrabold text-foreground">How you sign in</h2>
          <p className="mt-1 text-sm text-muted">Every way that uses {user.email} opens this same account, so you can switch between them.</p>
          <ul className="mt-3 divide-y divide-border">
            {PROVIDERS.map((p) => (
              <li key={p.id} className="flex min-h-12 items-center justify-between gap-4 text-sm">
                <span className="font-bold text-foreground">{p.name}</span>
                <span className={linked.has(p.id) ? "text-accent" : "text-muted"}>{linked.has(p.id) ? "Connected" : "Not used yet"}</span>
              </li>
            ))}
            <li className="flex min-h-12 items-center justify-between gap-4 text-sm">
              <span className="font-bold text-foreground">Email link</span>
              <span className="text-muted">Always works with this address</span>
            </li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard className="scroll-mt-28">
        <div id="comments">
          <h2 className="text-lg font-extrabold text-foreground">Your comments ({user.comments.length})</h2>
          <p className="mt-1 text-sm text-muted">Your name and picture show next to them; your email address never does.</p>
          {user.comments.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No comments yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {user.comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <Link href={`/blog/${c.postSlug}#comment-${c.id}`} className="font-bold text-accent underline-offset-2 hover:underline">
                    {c.postSlug}
                  </Link>
                  <span className="ml-2 text-xs text-muted">{STATUS_LABEL[c.status] ?? c.status}</span>
                  <p className="mt-1 line-clamp-2 whitespace-pre-line text-muted">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>

      <SectionCard className="scroll-mt-28">
        <div id="data" className="space-y-4">
          <h2 className="text-lg font-extrabold text-foreground">Privacy and your data</h2>
          <p className="text-sm text-muted">
            {user.trackReading
              ? "Reading tracking is on: how far you read, for how long, and on which days. Only you see it."
              : "Reading tracking is off: nothing new is recorded. What is already there stays until you delete it."}
          </p>
          <TrackingControls tracking={user.trackReading} hasHistory={user._count.readingHistory > 0} />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/api/me/export" download className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 font-bold text-foreground transition hover:border-accent/50">
              Download my data
            </a>
            <span className="text-muted">
              A JSON file with everything stored about you. Details are in the{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                privacy policy
              </Link>
              .
            </span>
          </div>
        </div>
      </SectionCard>

      <section id="delete" className="scroll-mt-28 rounded-2xl border border-red-500/40 p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-foreground">Delete account</h2>
        <DeleteAccount />
      </section>
    </div>
  );
}

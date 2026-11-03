import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyEmailOff } from "@/lib/reader/emails";
import { turnEmailOff } from "@/lib/reader/email-off";

// Reached only from emails; keep it out of search results.
export const metadata: Metadata = {
  title: "Email settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const NAMES = { replies: "reply emails", reminder: "the Sunday reminder" } as const;
const DONE = { replies: "Reply emails are off", reminder: "The Sunday reminder is off" } as const;

async function turnOff(form: FormData): Promise<void> {
  "use server";
  const t = form.get("t");
  const target = verifyEmailOff(form.get("u"), form.get("k"), t);
  if (!target || typeof t !== "string") redirect("/email-off");
  await turnEmailOff(target.userId, target.kind);
  redirect(`/email-off?u=${encodeURIComponent(target.userId)}&k=${target.kind}&t=${encodeURIComponent(t)}&done=1`);
}

export default async function EmailOffPage({ searchParams }: { searchParams: Promise<{ u?: string; k?: string; t?: string; done?: string }> }) {
  const params = await searchParams;
  const target = verifyEmailOff(params.u, params.k, params.t);

  return (
    <div className="mx-auto flex min-h-[50dvh] max-w-lg flex-col items-center justify-center px-4 text-center">
      {!target ? (
        <>
          <h1 className="text-2xl font-bold text-foreground">This link does not work</h1>
          <p className="mt-2 text-muted">
            It may be cut off. You can switch every email on or off in{" "}
            <Link href="/dashboard/account#email" className="text-accent underline underline-offset-2">
              your profile
            </Link>
            .
          </p>
        </>
      ) : params.done === "1" ? (
        <>
          <h1 className="text-2xl font-bold text-foreground">{DONE[target.kind]}</h1>
          <p className="mt-2 text-muted">
            You can turn it back on any time in{" "}
            <Link href="/dashboard/account#email" className="text-accent underline underline-offset-2">
              your profile
            </Link>
            .
          </p>
        </>
      ) : (
        <form action={turnOff}>
          <h1 className="text-2xl font-bold text-foreground">Turn off {NAMES[target.kind]}?</h1>
          <p className="mt-2 text-muted">Nothing else changes: your account, library and the newsletter stay as they are.</p>
          <input type="hidden" name="u" value={target.userId} />
          <input type="hidden" name="k" value={target.kind} />
          <input type="hidden" name="t" value={params.t} />
          <button type="submit" className="mt-6 min-h-11 rounded-xl bg-accent px-6 text-sm font-bold text-accent-foreground">
            Turn it off
          </button>
        </form>
      )}
    </div>
  );
}

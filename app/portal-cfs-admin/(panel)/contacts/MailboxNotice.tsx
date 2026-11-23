import type { MailboxState } from "@/lib/mailbox/inbox";

/** Says why emails are missing when the mailbox is not connected or could not be read. */
export default function MailboxNotice({ state }: { state: MailboxState }) {
  if (state.connected) return null;
  return (
    <div role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">
      {state.reason === "not-configured" ? (
        <>
          <p className="font-semibold">The office@ mailbox is not connected yet.</p>
          <p className="mt-1 text-muted">
            Only the messages from the site&rsquo;s forms are shown, and answers open in your mail program. Once the mailbox app password is set in
            Vercel (MAILBOX_USER and MAILBOX_PASSWORD), emails appear here and you can answer from this page.
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold">Emails could not be loaded.</p>
          <p className="mt-1 text-muted">{state.detail} The messages from the site&rsquo;s forms are shown below.</p>
        </>
      )}
    </div>
  );
}

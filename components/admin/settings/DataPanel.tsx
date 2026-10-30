"use client";

import { useActionState, useState, useTransition } from "react";
import { erasePersonAction, exportPersonAction, lookupPersonAction, type ActionResult } from "@/app/portal-cfs-admin/settings/actions";
import type { ErasureCounts, PersonSummary } from "@/lib/privacy/person-data";

const INPUT =
  "mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none";
const BUTTON = "min-h-11 rounded-lg gradient-btn px-5 py-2 text-sm font-medium transition disabled:opacity-60";
const QUIET = "inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2 disabled:opacity-60";
const DANGER = "inline-flex min-h-11 items-center rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-red-500/30 disabled:opacity-60";

const date = (value: Date | string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Message({ result }: { result: ActionResult<unknown> }) {
  if (!result.message) return null;
  return (
    <p aria-live="polite" className={`rounded-lg px-4 py-3 text-sm ${result.ok ? "bg-emerald-500/20" : "bg-red-500/20"} text-foreground`}>
      {result.message}
    </p>
  );
}

function Summary({ person }: { person: PersonSummary }) {
  const rows: [string, string][] = [
    ["Newsletter", person.subscriber ? `${person.subscriber.confirmed ? "Confirmed" : "Waiting for confirmation"}, signed up ${date(person.subscriber.signedUpAt)}` : "Not subscribed"],
    ["Course waitlist", person.waitlist ? `${person.waitlist.confirmed ? "Confirmed" : "Unconfirmed"}, level ${person.waitlist.level}, joined ${date(person.waitlist.joinedAt)}` : "Not on the list"],
    ["Contact messages", person.contactMessages === 0 ? "None" : String(person.contactMessages)],
    ["User account", person.account ? `${person.account.name ?? "No name"}, created ${date(person.account.createdAt)}, role ${person.account.role}` : "None"],
  ];
  return (
    <dl className="space-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5 border-b border-border/60 pb-2 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium text-foreground sm:text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EraseForm({ email, onErased }: { email: string; onErased: (counts: ErasureCounts) => void }) {
  const [result, submit, pending] = useActionState(
    async (previous: ActionResult<ErasureCounts>, formData: FormData) => {
      const next = await erasePersonAction(previous, formData);
      if (next.ok && next.data) onErased(next.data);
      return next;
    },
    { ok: false, message: "" },
  );
  return (
    <form action={submit} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      <label htmlFor="erase-confirm" className="block text-sm font-medium text-foreground">
        Type the address again to delete everything about it
      </label>
      <input id="erase-confirm" name="confirm" type="email" autoComplete="off" required className={`${INPUT} max-w-md`} />
      <p className="text-xs text-muted-foreground">
        Removes the newsletter row, the waitlist row, every contact message and any user account with its history. This cannot be undone.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={DANGER}>
          {pending ? "Deleting…" : "Delete everything for this address"}
        </button>
      </div>
      <Message result={result} />
    </form>
  );
}

/**
 * The two things a reader can ask for under the GDPR: a copy of their data and
 * its deletion. Both are logged without the address itself.
 */
export default function DataPanel() {
  const [lookup, submitLookup, pendingLookup] = useActionState(lookupPersonAction, { ok: false, message: "" });
  const [exportMessage, setExportMessage] = useState("");
  const [exporting, startExport] = useTransition();
  const [erased, setErased] = useState<ErasureCounts | null>(null);
  const person = lookup.ok && lookup.data && !erased ? lookup.data : null;

  function download() {
    if (!person) return;
    startExport(async () => {
      const result = await exportPersonAction(person.email);
      setExportMessage(result.ok ? "" : result.message);
      if (!result.ok || !result.data) return;
      const blob = new Blob([result.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `codefromscratch-data-${person.email.replace(/[^a-z0-9]+/gi, "-")}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Data and privacy</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          When a reader asks what you hold about them, or asks to be forgotten, answer from here. Both requests must be answered within a month.
        </p>
      </div>

      <form action={submitLookup} className="glow-border space-y-4 rounded-xl bg-surface p-5">
        <div>
          <label htmlFor="person-email" className="block text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="person-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            required
            defaultValue={lookup.values?.email ?? lookup.data?.email ?? ""}
            className={`${INPUT} max-w-md`}
            onChange={() => setErased(null)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pendingLookup} className={BUTTON}>
            {pendingLookup ? "Searching…" : "Search"}
          </button>
        </div>
        <Message result={erased ? { ok: true, message: "Deleted. Nothing about this address remains in the database." } : lookup} />
      </form>

      {person && (
        <div className="glow-border space-y-5 rounded-xl bg-surface p-5">
          <h3 className="text-sm font-semibold text-foreground">{person.email}</h3>
          <Summary person={person} />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={download} disabled={exporting} className={QUIET}>
              {exporting ? "Preparing…" : "Download a copy (JSON)"}
            </button>
            {exportMessage && <p className="text-sm text-red-400">{exportMessage}</p>}
          </div>
          <div className="border-t border-border pt-5">
            <EraseForm email={person.email} onErased={setErased} />
          </div>
        </div>
      )}
    </div>
  );
}

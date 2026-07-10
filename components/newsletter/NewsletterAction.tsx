"use client";

import { useState } from "react";
import Link from "next/link";

type Result = "confirmed" | "already" | "unsubscribed" | "expired" | "invalid" | "error";

const COPY: Record<Result, { heading: string; body: string }> = {
  confirmed: {
    heading: "Subscription confirmed!",
    body: "You're on the list — new tutorials and deep dives land straight in your inbox.",
  },
  already: {
    heading: "Already confirmed",
    body: "This subscription was confirmed earlier. Nothing more to do.",
  },
  unsubscribed: {
    heading: "Unsubscribed",
    body: "You won't receive the newsletter anymore. Sorry to see you go.",
  },
  expired: {
    heading: "Link expired",
    body: "This confirmation link is older than 7 days. Subscribe again to get a fresh one.",
  },
  invalid: {
    heading: "Invalid link",
    body: "This link is invalid or was already used. If you meant to subscribe, sign up again for a fresh email.",
  },
  error: {
    heading: "Something went wrong",
    body: "We couldn't reach the server. Please try again in a minute.",
  },
};

/**
 * Interstitial for newsletter email links. The email links only lead here;
 * the actual mutation fires on the button press below — mail scanners that
 * prefetch links can no longer confirm or unsubscribe anyone by accident.
 */
export default function NewsletterAction({
  token,
  mode,
}: {
  token: string;
  mode: "confirm" | "unsubscribe";
}) {
  const [state, setState] = useState<"idle" | "working" | Result>("idle");

  async function run() {
    setState("working");
    try {
      const res = await fetch(`/api/newsletter/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data: { status?: string } | null = await res.json().catch(() => null);
      const status = data?.status;
      if (
        status === "confirmed" ||
        status === "already" ||
        status === "unsubscribed" ||
        status === "expired" ||
        status === "invalid"
      ) {
        setState(status);
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "idle" || state === "working") {
    const isConfirm = mode === "confirm";
    return (
      <>
        <h1 className="text-2xl font-bold text-foreground">
          {isConfirm ? "Confirm your subscription" : "Unsubscribe from the newsletter"}
        </h1>
        <p className="mt-2 max-w-md text-muted">
          {isConfirm
            ? "One click and the newsletter is yours — this extra step keeps bots off the list."
            : "Press the button below and you won't receive the newsletter anymore."}
        </p>
        <button
          type="button"
          onClick={run}
          disabled={state === "working"}
          className="mt-6 rounded-lg gradient-btn px-6 py-2.5 text-sm font-medium transition disabled:opacity-50"
        >
          {state === "working"
            ? "Just a moment…"
            : isConfirm
              ? "Confirm subscription"
              : "Unsubscribe"}
        </button>
      </>
    );
  }

  const copy = COPY[state];
  const succeeded = state === "confirmed" || state === "already" || state === "unsubscribed";
  return (
    <>
      {succeeded && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <h1 className="text-2xl font-bold text-foreground">{copy.heading}</h1>
      <p className="mt-2 max-w-md text-muted">{copy.body}</p>
      {state === "error" && (
        <button
          type="button"
          onClick={run}
          className="mt-6 rounded-lg gradient-btn px-6 py-2.5 text-sm font-medium transition"
        >
          Try again
        </button>
      )}
      <Link href="/" className="mt-6 text-sm text-accent hover:underline">
        Back to home
      </Link>
    </>
  );
}

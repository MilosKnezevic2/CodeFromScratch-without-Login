"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

/** Sign-in with a one-time link, for any email address. */
export default function EmailSignIn({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        // Auth.js sends the link and moves on to /login/check-email.
        void signIn("resend", { email, redirectTo: callbackUrl });
      }}
      className="space-y-3"
    >
      <label htmlFor="login-email" className="block text-sm font-medium text-foreground">
        Email address
      </label>
      <input
        id="login-email"
        type="email"
        name="email"
        inputMode="email"
        autoComplete="email"
        required
        maxLength={254}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="h-12 w-full rounded-lg border border-border bg-surface-2 px-3 text-base text-foreground outline-none focus:border-accent/60"
      />
      <button
        type="submit"
        disabled={busy}
        className="flex min-h-12 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Sending the link…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}

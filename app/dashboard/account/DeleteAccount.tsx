"use client";

import { useActionState } from "react";
import { deleteAccountAction, type DeleteState } from "./actions";

export default function DeleteAccount() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccountAction, {});
  return (
    <form action={action} className="mt-4 space-y-3">
      <label htmlFor="confirm-delete" className="block text-sm text-muted">
        Type <strong className="text-foreground">delete</strong> to remove your account, every comment you wrote, your saved articles, folders
        and reading history. This cannot be undone.
      </label>
      <input
        id="confirm-delete"
        name="confirm"
        autoComplete="off"
        required
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "confirm-delete-error" : undefined}
        className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-base text-foreground outline-none focus:border-red-400/60"
      />
      {state.error && (
        <p id="confirm-delete-error" role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg border border-red-500/40 px-5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}

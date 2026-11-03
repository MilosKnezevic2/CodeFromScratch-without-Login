"use client";

import { useActionState, useState } from "react";
import { createFolderAction, renameFolderAction, type FormResult } from "../actions";

export function NewFolderForm() {
  const [state, action, pending] = useActionState<FormResult, FormData>(createFolderAction, {});
  return (
    <form action={action} className="flex flex-wrap items-start gap-2">
      <label htmlFor="new-folder" className="sr-only">
        New folder name
      </label>
      <input
        id="new-folder"
        name="name"
        required
        maxLength={60}
        placeholder="New folder, e.g. To read this weekend"
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "new-folder-error" : undefined}
        className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-base text-foreground outline-none focus:border-accent/60"
      />
      <button type="submit" disabled={pending} className="h-11 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50">
        Create folder
      </button>
      {state.error && (
        <p id="new-folder-error" role="alert" className="w-full text-sm text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function RenameFolderForm({ folderId, name }: { folderId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormResult, FormData>(async (prev, form) => {
    const result = await renameFolderAction(prev, form);
    if (result.ok) setEditing(false);
    return result;
  }, {});
  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="min-h-9 text-xs text-muted-foreground hover:text-foreground">
        Rename
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="folderId" value={folderId} />
      <label htmlFor={`rename-${folderId}`} className="sr-only">
        New name for {name}
      </label>
      <input
        id={`rename-${folderId}`}
        name="name"
        defaultValue={name}
        required
        maxLength={60}
        className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-accent/60"
      />
      <button type="submit" disabled={pending} className="h-9 rounded-lg border border-border px-3 text-xs font-semibold text-foreground">
        Save
      </button>
      <button type="button" onClick={() => setEditing(false)} className="h-9 px-2 text-xs text-muted-foreground">
        Cancel
      </button>
      {state.error && (
        <p role="alert" className="w-full text-xs text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}

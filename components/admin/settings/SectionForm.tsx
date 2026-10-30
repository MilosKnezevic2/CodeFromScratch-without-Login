"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/app/portal-cfs-admin/settings/actions";
import type { Field, FlatValues } from "@/lib/settings/schema";

const INPUT =
  "mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none";

function Status({ result }: { result: ActionResult }) {
  if (!result.message) return <p className="min-h-5" aria-live="polite" />;
  return (
    <p
      aria-live="polite"
      className={`rounded-lg px-4 py-3 text-sm ${result.ok ? "bg-emerald-500/20 text-foreground" : "bg-red-500/20 text-foreground"}`}
    >
      {result.message}
    </p>
  );
}

function Control({ field, value, error }: { field: Field; value: string | number | boolean | undefined; error?: string }) {
  const id = `field-${field.name.replace(/\./g, "-")}`;
  const describedBy = [field.help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

  if (field.type === "toggle") {
    return (
      <div>
        <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3">
          <input
            id={id}
            type="checkbox"
            name={field.name}
            defaultChecked={value === true}
            aria-describedby={describedBy}
            className="mt-1 h-5 w-5 shrink-0 accent-accent"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">{field.label}</span>
            {field.help && (
              <span id={`${id}-help`} className="mt-0.5 block text-xs text-muted-foreground">
                {field.help}
              </span>
            )}
          </span>
        </label>
        {error && (
          <p id={`${id}-error`} className="mt-1 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  const text = value === undefined || value === null ? "" : String(value);
  const shared = {
    id,
    name: field.name,
    defaultValue: text,
    required: field.required,
    maxLength: field.maxLength,
    placeholder: field.placeholder,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    className: INPUT,
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea {...shared} rows={3} />
      ) : field.type === "select" ? (
        <select {...shared}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input {...shared} type="number" inputMode="numeric" min={field.min} max={field.max} step={1} />
      ) : field.type === "date" ? (
        <input {...shared} type="date" />
      ) : field.type === "email" ? (
        <input {...shared} type="email" inputMode="email" autoComplete="off" />
      ) : field.type === "url" || field.type === "link" ? (
        <input {...shared} type="text" inputMode="url" autoComplete="off" spellCheck={false} />
      ) : (
        <input {...shared} type="text" autoComplete="off" />
      )}
      {field.help && (
        <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">
          {field.help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * One settings section as a form. The field list comes from the schema, the
 * values from the database, and the server action decides what is valid, so
 * the same rules apply whether the form or anything else sends the data.
 */
export default function SectionForm({
  title,
  description,
  fields,
  values,
  action,
  before,
}: {
  title: string;
  description: string;
  fields: Field[];
  values: FlatValues;
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  before?: React.ReactNode;
}) {
  const [result, submit, pending] = useActionState(action, { ok: false, message: "" });
  // React resets a form after its action runs; on a validation failure the
  // submitted values come back and take the place of the stored ones.
  const current = (field: Field) => {
    if (!result.values) return values[field.name];
    if (field.type === "toggle") return result.values[field.name] === "on";
    return result.values[field.name] ?? "";
  };

  return (
    <form action={submit} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {before}
      <div className="glow-border grid gap-5 rounded-xl bg-surface p-5">
        {fields.map((field) => (
          <Control key={field.name} field={field} value={current(field)} error={result.errors?.[field.name]} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="min-h-11 rounded-lg gradient-btn px-5 py-2 text-sm font-medium transition disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <div className="min-w-0 flex-1">
          <Status result={result} />
        </div>
      </div>
    </form>
  );
}

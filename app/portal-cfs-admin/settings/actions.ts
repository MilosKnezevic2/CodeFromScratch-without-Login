"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  cancelMfaEnrolment,
  changePassword,
  changeUsername,
  confirmMfaEnrolment,
  disableMfa,
  startMfaEnrolment,
  type Enrolment,
} from "@/lib/admin-auth";
import { isAdminRequest } from "@/lib/admin-guard";
import { clientIp, recordAudit } from "@/lib/audit";
import { isValidEmail } from "@/lib/newsletter/input";
import { emailReference, erasePersonData, exportPersonData, findPersonData, type ErasureCounts, type PersonSummary } from "@/lib/privacy/person-data";
import { changedFields, parseSection, SECTIONS, stripeKeyMode, type Section } from "@/lib/settings/schema";
import { loadSettings, revalidateSettings, saveSection } from "@/lib/settings/store";

export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** What was submitted, returned on a validation failure so the form keeps it. */
  values?: Record<string, string>;
  data?: T;
}

const FORBIDDEN: ActionResult<never> = { ok: false, message: "Your session has ended. Sign in again." };

async function ip(): Promise<string | null> {
  return clientIp(await headers());
}

/** Reads a form into plain strings; repeated names keep the last value. */
function entries(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function saveSettingsAction(section: Section, _previous: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  if (!SECTIONS.includes(section)) return { ok: false, message: "Unknown settings section." };

  const submitted = entries(formData);
  const { value, errors } = parseSection(section, submitted, {
    stripeKeyMode: stripeKeyMode(process.env.STRIPE_SECRET_KEY),
  });
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Some fields need a correction.", errors, values: submitted };
  }

  try {
    const before = (await loadSettings())[section];
    await saveSection(section, value);
    await recordAudit("settings.saved", { section, changed: changedFields(before, value) }, await ip());
    revalidateSettings();
  } catch (error) {
    console.error("Settings save failed:", error);
    return { ok: false, message: "Could not save. The database may be asleep; try again in a minute." };
  }
  return { ok: true, message: "Saved. Readers see the change within a minute." };
}

export async function changePasswordAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  const form = entries(formData);
  if (form.next !== form.confirm) return { ok: false, message: "The two new passwords do not match." };
  const result = await changePassword({ current: form.current ?? "", next: form.next ?? "", ip: await ip() });
  if (!result.ok) return { ok: false, message: result.error };
  revalidatePath("/portal-cfs-admin/settings");
  return { ok: true, message: "Password changed. Use it from your next sign-in." };
}

export async function changeUsernameAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  const form = entries(formData);
  const result = await changeUsername({ password: form.password ?? "", username: (form.username ?? "").trim(), ip: await ip() });
  if (!result.ok) return { ok: false, message: result.error };
  revalidatePath("/portal-cfs-admin/settings");
  return { ok: true, message: "Username changed." };
}

export async function startMfaAction(): Promise<ActionResult<Enrolment>> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  const result = await startMfaEnrolment();
  if ("error" in result) return { ok: false, message: result.error };
  return { ok: true, message: "Scan the code, then enter the 6 digits the app shows.", data: result };
}

export async function cancelMfaAction(): Promise<ActionResult> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  await cancelMfaEnrolment();
  return { ok: true, message: "Setup cancelled." };
}

export async function confirmMfaAction(_previous: ActionResult<string[]>, formData: FormData): Promise<ActionResult<string[]>> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  const result = await confirmMfaEnrolment(entries(formData).code ?? "", await ip());
  if ("error" in result) return { ok: false, message: result.error };
  // No revalidation here: the panel must keep showing the backup codes until
  // the operator confirms they are saved, then it refreshes itself.
  return { ok: true, message: "Two-step login is on. Save these backup codes somewhere safe; they are shown once.", data: result.backupCodes };
}

export async function disableMfaAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  const result = await disableMfa(entries(formData).code ?? "", await ip());
  if (!result.ok) return { ok: false, message: result.error };
  revalidatePath("/portal-cfs-admin/settings");
  return { ok: true, message: "Two-step login is off." };
}

export async function refreshCacheAction(): Promise<ActionResult> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  revalidateSettings();
  await recordAudit("cache.refreshed", {}, await ip());
  return { ok: true, message: "Every public page will be rebuilt on its next visit." };
}

export async function lookupPersonAction(_previous: ActionResult<PersonSummary>, formData: FormData): Promise<ActionResult<PersonSummary>> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  const email = (entries(formData).email ?? "").trim();
  if (!isValidEmail(email)) return { ok: false, message: "Enter a valid email address.", values: { email } };
  try {
    const data = await findPersonData(email);
    await recordAudit("person.looked-up", { ref: emailReference(email) }, await ip());
    const found = data.subscriber || data.waitlist || data.contactMessages > 0 || data.account;
    return { ok: true, message: found ? "Here is what the site holds for this address." : "Nothing is stored for this address.", data };
  } catch (error) {
    console.error("Person lookup failed:", error);
    return { ok: false, message: "Could not search right now. Try again in a minute." };
  }
}

export async function exportPersonAction(email: string): Promise<ActionResult<string>> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  if (!isValidEmail(email)) return { ok: false, message: "Enter a valid email address." };
  try {
    const data = await exportPersonData(email);
    await recordAudit("person.exported", { ref: emailReference(email) }, await ip());
    return { ok: true, message: "Copy ready.", data: JSON.stringify(data, null, 2) };
  } catch (error) {
    console.error("Person export failed:", error);
    return { ok: false, message: "Could not build the copy right now." };
  }
}

export async function erasePersonAction(_previous: ActionResult<ErasureCounts>, formData: FormData): Promise<ActionResult<ErasureCounts>> {
  if (!(await isAdminRequest())) return FORBIDDEN;
  const form = entries(formData);
  const email = (form.email ?? "").trim();
  if (!isValidEmail(email)) return { ok: false, message: "Enter a valid email address." };
  if ((form.confirm ?? "").trim().toLowerCase() !== email.toLowerCase()) {
    return { ok: false, message: "Type the address again, exactly, to confirm the deletion." };
  }
  try {
    const counts = await erasePersonData(email);
    await recordAudit("person.erased", { ref: emailReference(email), ...counts }, await ip());
    const total = counts.subscriber + counts.waitlist + counts.contactMessages + counts.account;
    return {
      ok: true,
      message: total === 0 ? "Nothing was stored for this address." : "Deleted. Nothing about this address remains in the database.",
      data: counts,
    };
  } catch (error) {
    console.error("Person erasure failed:", error);
    return { ok: false, message: "Could not delete right now. Nothing was changed." };
  }
}

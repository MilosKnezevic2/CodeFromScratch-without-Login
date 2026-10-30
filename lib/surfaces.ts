import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings/store";

/**
 * The commerce and account pages exist in the code for the relaunch but are
 * not part of the public site yet. Until the matching switch is turned on in
 * Settings they answer a real 404, so neither readers nor search engines meet
 * a pricing page for things that cannot be bought. robots.txt alone did not
 * keep them out of the index.
 */
export async function requireCommerce(): Promise<void> {
  if (!(await getSettings()).payments.enabled) notFound();
}

export async function requireAccounts(): Promise<void> {
  if (!(await getSettings()).features.registrationOpen) notFound();
}

import { requireAccounts } from "@/lib/surfaces";

/** Onboarding belongs to user accounts: a 404 until registration is switched on in Settings. */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireAccounts();
  return children;
}

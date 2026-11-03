import { redirect } from "next/navigation";
import { currentReader } from "@/lib/comments-store";

/** The signed-in reader for a dashboard page, or a redirect to log in and come back. */
export async function requireReader(returnTo: string): Promise<{ id: string; name: string | null; email: string }> {
  const reader = await currentReader();
  if (!reader) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  return reader;
}

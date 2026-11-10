/**
 * Where to send a reader after sign-in: a path on this site, never another
 * origin (an open redirect would let a link to /login?callbackUrl=… send
 * people anywhere after a real sign-in).
 */
export function safeCallbackPath(value: string | undefined | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value.startsWith("/login")) return "/";
  return value.slice(0, 500);
}

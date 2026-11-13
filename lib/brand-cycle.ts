/** Sunday rewrites an older article; Monday, Wednesday and Friday draft a new one. */
export function cycleTaskFor(date: Date): "brand-cycle" | "rewrite" | null {
  const day = date.getUTCDay();
  if (day === 0) return "rewrite";
  if (day === 1 || day === 3 || day === 5) return "brand-cycle";
  return null;
}

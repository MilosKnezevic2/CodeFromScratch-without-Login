const TZ = "Europe/Vienna";

/** The exact time, in the operator's time zone. */
export function formatWhen(date: Date): string {
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

/** "3 days ago", "8 months ago": how long ago, next to the exact date. */
export function age(date: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  const units: [number, string][] = [
    [365 * 86400, "year"],
    [30 * 86400, "month"],
    [7 * 86400, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [size, unit] of units) {
    if (seconds < size) continue;
    const n = Math.round(seconds / size);
    return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Opens the operator's own mail program with the answer started; the fallback while the mailbox is not connected. */
export function mailtoReply(address: string, subject: string): string {
  return `mailto:${encodeURIComponent(address).replace(/%40/g, "@")}?subject=${encodeURIComponent(subject)}`;
}

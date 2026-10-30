export const WAITLIST_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type WaitlistLevel = (typeof WAITLIST_LEVELS)[number];

export const WAITLIST_NOTE_MAX = 300;

/** Unconfirmed sign-ups must confirm within this window. */
export const WAITLIST_CONFIRM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isWaitlistLevel(value: unknown): value is WaitlistLevel {
  return typeof value === "string" && (WAITLIST_LEVELS as readonly string[]).includes(value);
}

export const SUBJECT_MAX = 150;
export const PREHEADER_MAX = 150;
export const NOTE_MAX = 5000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);
}

export interface LetterInput {
  subject: string;
  preheader: string;
  note: string;
  postSlug: string;
}

export type ParsedLetter = { ok: true; value: LetterInput } | { ok: false; error: string };

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Validates what the compose form sends. The API trusts nothing else. */
export function parseLetterInput(body: unknown): ParsedLetter {
  const raw = (body ?? {}) as Record<string, unknown>;
  const subject = text(raw.subject);
  const preheader = text(raw.preheader);
  const note = text(raw.note);
  const postSlug = text(raw.postSlug);

  if (!subject) return { ok: false, error: "Subject is required." };
  if (subject.length > SUBJECT_MAX) {
    return { ok: false, error: `Subject is longer than ${SUBJECT_MAX} characters.` };
  }
  if (/[\r\n]/.test(subject)) return { ok: false, error: "Subject must be a single line." };
  if (preheader.length > PREHEADER_MAX) {
    return { ok: false, error: `Preview text is longer than ${PREHEADER_MAX} characters.` };
  }
  if (note.length > NOTE_MAX) {
    return { ok: false, error: `The note is longer than ${NOTE_MAX} characters.` };
  }
  if (postSlug && !/^[a-z0-9-]{1,200}$/.test(postSlug)) {
    return { ok: false, error: "That article does not exist." };
  }
  if (!note && !postSlug) return { ok: false, error: "Pick an article or write a note." };

  return { ok: true, value: { subject, preheader, note, postSlug } };
}

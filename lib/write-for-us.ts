import { sanitizeInput, validateEmail, validateName } from "@/lib/sanitize";

/**
 * "Write for us" pitches. They are stored as contact messages (the admin
 * inbox already lists, reads and deletes those) with a recognisable subject,
 * so the database needs no new table for them.
 */

export const EXPERIENCE = ["learning", "working", "senior"] as const;
export type Experience = (typeof EXPERIENCE)[number];

export const EXPERIENCE_LABEL: Record<Experience, string> = {
  learning: "I'm still learning, and I just figured something out",
  working: "I build things for a living",
  senior: "I lead teams or have written technical articles before",
};

export const LIMITS = {
  name: 100,
  email: 254,
  topic: { min: 5, max: 120 },
  pitch: { min: 100, max: 2000 },
  links: 500,
} as const;

export const SUBJECT_PREFIX = "Write for us: ";

export type Application = {
  name: string;
  email: string;
  experience: Experience;
  topic: string;
  pitch: string;
  links: string;
};

export type ParseResult = { ok: true; value: Application } | { ok: false; error: string };

const text = (value: unknown, max: number) => sanitizeInput(typeof value === "string" ? value : "", max);

/** Validates a submitted pitch. Every message names the field, so the form can say what to fix. */
export function parseApplication(body: Record<string, unknown>): ParseResult {
  const name = text(body.name, LIMITS.name);
  const email = text(body.email, LIMITS.email).toLowerCase();
  const experience = body.experience;
  const topic = text(body.topic, LIMITS.topic.max);
  const pitch = text(body.pitch, LIMITS.pitch.max);
  const links = text(body.links, LIMITS.links);

  if (!validateName(name)) return { ok: false, error: "Please enter your name (letters, spaces, hyphens and apostrophes)." };
  if (!validateEmail(email)) return { ok: false, error: "Please enter a valid email address." };
  if (typeof experience !== "string" || !(EXPERIENCE as readonly string[]).includes(experience)) {
    return { ok: false, error: "Please pick where you are as a developer." };
  }
  if (topic.length < LIMITS.topic.min) return { ok: false, error: `Please give your article a working title (at least ${LIMITS.topic.min} characters).` };
  if (pitch.length < LIMITS.pitch.min) return { ok: false, error: `Please tell me a bit more about the article (at least ${LIMITS.pitch.min} characters).` };
  if (body.consent !== true) return { ok: false, error: "Please confirm that you have read how your details are used." };

  return { ok: true, value: { name, email, experience: experience as Experience, topic, pitch, links } };
}

/** The inbox subject: recognisable in the list of contact messages. */
export function applicationSubject(app: Application): string {
  return `${SUBJECT_PREFIX}${app.topic}`;
}

/** The inbox body and the notification email: plain text, one field per block. */
export function applicationMessage(app: Application): string {
  return [
    `Working title: ${app.topic}`,
    `Experience: ${EXPERIENCE_LABEL[app.experience]}`,
    `Links: ${app.links || "none given"}`,
    "",
    "Pitch:",
    app.pitch,
  ].join("\n");
}

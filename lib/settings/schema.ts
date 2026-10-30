/**
 * Every setting the portal can change: its default, its rules and the form
 * field that edits it. Pure, so the rules are tested without a database. The
 * store reads and writes, the form renders from the field lists, and this file
 * decides what is valid.
 */

import { SITE_CONFIG, SOCIAL_LINKS } from "@/lib/config";
import { isValidEmail } from "@/lib/newsletter/input";

export type Section = "general" | "seo" | "newsletter" | "features" | "analytics" | "payments";

export const SECTIONS: readonly Section[] = ["general", "seo", "newsletter", "features", "analytics", "payments"];

export interface SocialLinks {
  github: string;
  x: string;
  linkedin: string;
  youtube: string;
  instagram: string;
  pinterest: string;
}

export interface Announcement {
  enabled: boolean;
  text: string;
  linkUrl: string;
  linkLabel: string;
}

export interface GeneralSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  ownerName: string;
  ownerCity: string;
  social: SocialLinks;
  announcement: Announcement;
}

export interface SeoSettings {
  defaultDescription: string;
  ogImageUrl: string;
  xHandle: string;
  googleVerification: string;
}

export interface NewsletterSettings {
  senderName: string;
  replyTo: string;
  welcomeLetter: boolean;
  pendingRetentionDays: number;
}

export interface FeatureSettings {
  commentsEnabled: boolean;
  articleNewsletterCard: boolean;
  courseWaitlistOpen: boolean;
  registrationOpen: boolean;
  showSocialLinks: boolean;
}

export interface AnalyticsSettings {
  monthlyVisitsGoal: number;
  subscribersGoal: number;
  ebookSubscribersGate: number;
  goalDeadline: string;
}

export interface LegalGate {
  lawyerConsulted: boolean;
  fagWording: boolean;
  withdrawalNotice: boolean;
  impressumAddress: boolean;
  taxRegistration: boolean;
}

export interface PaymentsSettings {
  enabled: boolean;
  currency: "EUR" | "USD" | "CHF" | "GBP";
  pricesIncludeVat: boolean;
  refundDays: number;
  legal: LegalGate;
}

export interface Settings {
  general: GeneralSettings;
  seo: SeoSettings;
  newsletter: NewsletterSettings;
  features: FeatureSettings;
  analytics: AnalyticsSettings;
  payments: PaymentsSettings;
}

export const DEFAULTS: Settings = {
  general: {
    siteName: SITE_CONFIG.name,
    tagline: "Hands-on tutorials, in-depth guides, and premium resources to help you master modern web development.",
    contactEmail: SITE_CONFIG.email,
    ownerName: "Milos Knezevic",
    ownerCity: SITE_CONFIG.location,
    social: {
      github: SOCIAL_LINKS.github ?? "",
      x: SOCIAL_LINKS.twitter ?? "",
      linkedin: SOCIAL_LINKS.linkedin ?? "",
      youtube: SOCIAL_LINKS.youtube ?? "",
      instagram: SOCIAL_LINKS.instagram ?? "",
      pinterest: SOCIAL_LINKS.pinterest ?? "",
    },
    announcement: { enabled: false, text: "", linkUrl: "", linkLabel: "" },
  },
  seo: {
    defaultDescription:
      "A journal for serious web developers — tutorials, guides, and deep dives on modern web development, with production-grade code you can read in your own repo.",
    ogImageUrl: "/brand/og-default.png",
    xHandle: "",
    googleVerification: "",
  },
  newsletter: {
    senderName: SITE_CONFIG.name,
    replyTo: SITE_CONFIG.email,
    welcomeLetter: true,
    pendingRetentionDays: 30,
  },
  features: {
    commentsEnabled: false,
    articleNewsletterCard: true,
    courseWaitlistOpen: true,
    registrationOpen: false,
    showSocialLinks: true,
  },
  analytics: {
    monthlyVisitsGoal: 500,
    subscribersGoal: 50,
    ebookSubscribersGate: 300,
    goalDeadline: "2027-01-31",
  },
  payments: {
    enabled: false,
    currency: "EUR",
    pricesIncludeVat: true,
    refundDays: 14,
    legal: {
      lawyerConsulted: false,
      fagWording: false,
      withdrawalNotice: false,
      impressumAddress: false,
      taxRegistration: false,
    },
  },
};

export type FieldType = "text" | "email" | "url" | "link" | "textarea" | "toggle" | "number" | "select" | "date";

export interface Field {
  /** Dot path inside the section, such as "social.x". Also the form field name. */
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternHint?: string;
  options?: readonly { value: string; label: string }[];
  placeholder?: string;
}

/** What a section of the settings page says about itself. */
export interface SectionInfo {
  title: string;
  description: string;
  fields: Field[];
}

const url = (name: string, label: string, placeholder: string): Field => ({
  name,
  label,
  type: "url",
  placeholder,
  maxLength: 300,
  help: "Leave empty to hide the icon.",
});

export const SECTION_INFO: Record<Section, SectionInfo> = {
  general: {
    title: "General",
    description: "The site's name, contact details and the links in the footer and on the contact page.",
    fields: [
      { name: "siteName", label: "Site name", type: "text", required: true, maxLength: 60 },
      {
        name: "tagline",
        label: "Footer text",
        type: "textarea",
        maxLength: 200,
        help: "The short description under the logo in the footer.",
      },
      {
        name: "contactEmail",
        label: "Public contact email",
        type: "email",
        required: true,
        help: "Shown in the footer and used as the reply address for the contact form.",
      },
      { name: "ownerName", label: "Your name", type: "text", required: true, maxLength: 80, help: "Shown in the footer of every email." },
      { name: "ownerCity", label: "City and country", type: "text", required: true, maxLength: 80 },
      url("social.github", "GitHub", "https://github.com/..."),
      url("social.x", "X", "https://x.com/..."),
      url("social.linkedin", "LinkedIn", "https://www.linkedin.com/in/..."),
      url("social.youtube", "YouTube", "https://www.youtube.com/@..."),
      url("social.instagram", "Instagram", "https://instagram.com/..."),
      url("social.pinterest", "Pinterest", "https://pinterest.com/..."),
      {
        name: "announcement.enabled",
        label: "Show an announcement bar at the top of the site",
        type: "toggle",
        help: "For a new article, a change of plans or a short notice. Readers see it within a minute of saving.",
      },
      { name: "announcement.text", label: "Announcement text", type: "text", maxLength: 160 },
      {
        name: "announcement.linkUrl",
        label: "Announcement link",
        type: "link",
        maxLength: 300,
        placeholder: "/blog/... or https://...",
      },
      { name: "announcement.linkLabel", label: "Link text", type: "text", maxLength: 40, placeholder: "Read it" },
    ],
  },
  seo: {
    title: "SEO",
    description: "What search engines and social networks show when they have nothing more specific for a page.",
    fields: [
      {
        name: "defaultDescription",
        label: "Default description",
        type: "textarea",
        required: true,
        maxLength: 160,
        help: "Shown under the title in Google for pages without their own description. 150 to 160 characters works best.",
      },
      {
        name: "ogImageUrl",
        label: "Default share image",
        type: "link",
        required: true,
        maxLength: 300,
        help: "1200 by 630 pixels. A path on this site such as /brand/og-default.png, or a full https address.",
      },
      {
        name: "xHandle",
        label: "X handle",
        type: "text",
        maxLength: 16,
        pattern: /^@?[A-Za-z0-9_]{1,15}$/,
        patternHint: "Letters, numbers and underscores only, up to 15 characters.",
        placeholder: "@codefromscratch",
        help: "Credited on X when someone shares an article. Leave empty if there is no account yet.",
      },
      {
        name: "googleVerification",
        label: "Google Search Console verification",
        type: "text",
        maxLength: 100,
        pattern: /^[A-Za-z0-9_-]*$/,
        patternHint: "Only the value from content=\"...\" of the meta tag.",
        help: "Only needed for the HTML-tag method. The site is already verified by DNS, so this can stay empty.",
      },
    ],
  },
  newsletter: {
    title: "Newsletter",
    description: "How letters are sent. The sending address itself is fixed to the verified domain and cannot change here.",
    fields: [
      { name: "senderName", label: "Sender name", type: "text", required: true, maxLength: 60, help: "What readers see as the sender." },
      { name: "replyTo", label: "Reply-to address", type: "email", required: true, help: "Replies from readers land here." },
      {
        name: "welcomeLetter",
        label: "Send the welcome letter with the checklist after someone confirms",
        type: "toggle",
      },
      {
        name: "pendingRetentionDays",
        label: "Delete unconfirmed sign-ups after (days)",
        type: "number",
        min: 7,
        max: 30,
        help: "The privacy policy promises 30 days at most, so this cannot go higher.",
      },
    ],
  },
  features: {
    title: "Features",
    description: "Switch parts of the site on or off. Changes reach readers within a minute.",
    fields: [
      { name: "articleNewsletterCard", label: "Newsletter card at the end of every article", type: "toggle" },
      {
        name: "commentsEnabled",
        label: "Comments under articles",
        type: "toggle",
        help: "Uses Giscus (GitHub Discussions). It only appears once the Giscus keys are set on Vercel.",
      },
      {
        name: "courseWaitlistOpen",
        label: "Course waitlist accepts sign-ups",
        type: "toggle",
        help: "When off, the page explains that the list is closed and the form is hidden.",
      },
      { name: "showSocialLinks", label: "Show social links in the footer and on the contact page", type: "toggle" },
      {
        name: "registrationOpen",
        label: "Allow visitors to create user accounts",
        type: "toggle",
        help: "Keep off. The privacy policy says the site has no user accounts; it must be rewritten before this goes on.",
      },
    ],
  },
  analytics: {
    title: "Analytics goals",
    description: "The targets the analytics page measures progress against.",
    fields: [
      { name: "monthlyVisitsGoal", label: "Visits per month", type: "number", min: 1, max: 10_000_000 },
      { name: "subscribersGoal", label: "Confirmed subscribers", type: "number", min: 1, max: 10_000_000 },
      {
        name: "ebookSubscribersGate",
        label: "Subscribers needed before the ebook",
        type: "number",
        min: 1,
        max: 10_000_000,
        help: "Your decision from 30 October 2026: 300 confirmed subscribers.",
      },
      { name: "goalDeadline", label: "Deadline for the goals", type: "date" },
    ],
  },
  payments: {
    title: "Payments",
    description:
      "Prepared for later. Nothing is for sale yet, and selling cannot be switched on with a live Stripe key until every legal step below is done.",
    fields: [
      {
        name: "enabled",
        label: "Accept payments",
        type: "toggle",
        help: "Opens checkout for subscriptions, ebooks and courses. With a test key this only allows test purchases.",
      },
      {
        name: "currency",
        label: "Currency",
        type: "select",
        options: [
          { value: "EUR", label: "Euro (EUR)" },
          { value: "USD", label: "US dollar (USD)" },
          { value: "CHF", label: "Swiss franc (CHF)" },
          { value: "GBP", label: "British pound (GBP)" },
        ],
      },
      {
        name: "pricesIncludeVat",
        label: "Prices shown include VAT",
        type: "toggle",
        help: "Consumers in the EU must see the final price including tax.",
      },
      {
        name: "refundDays",
        label: "Refund window (days)",
        type: "number",
        min: 0,
        max: 60,
        help: "EU consumers have a 14-day right of withdrawal on top of any promise made here.",
      },
      { name: "legal.lawyerConsulted", label: "An Austrian lawyer or the WKO has confirmed the setup", type: "toggle" },
      { name: "legal.taxRegistration", label: "Tax and business registration are done (Steuerberater or WKO)", type: "toggle" },
      { name: "legal.fagWording", label: "Checkout shows the FAGG section 8 wording", type: "toggle" },
      { name: "legal.withdrawalNotice", label: "Withdrawal notice (Widerrufsbelehrung) is on the site", type: "toggle" },
      { name: "legal.impressumAddress", label: "The Impressum shows the required address", type: "toggle" },
    ],
  },
};

export type FlatValues = Record<string, string | number | boolean>;

/** Turns nested settings into "a.b" keys the form fields use. */
export function flatten(value: object, prefix = ""): FlatValues {
  const out: FlatValues = {};
  for (const [key, inner] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (inner && typeof inner === "object") Object.assign(out, flatten(inner, path));
    else out[path] = inner as string | number | boolean;
  }
  return out;
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let node = target;
  for (const part of parts.slice(0, -1)) {
    const next = node[part];
    if (!next || typeof next !== "object") node[part] = {};
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

function getPath(source: unknown, path: string): unknown {
  let node: unknown = source;
  for (const part of path.split(".")) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

const ABSOLUTE_URL = /^https:\/\/[^\s<>"']+$/;
const SITE_PATH = /^\/[^\s<>"']*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads one submitted value against its field. Returns the clean value or an
 * error message for the person filling in the form.
 */
export function readField(field: Field, raw: unknown): { value?: string | number | boolean; error?: string } {
  if (field.type === "toggle") return { value: raw === "on" || raw === true || raw === "true" };

  const text = typeof raw === "string" ? raw.trim() : raw === undefined || raw === null ? "" : String(raw).trim();

  if (field.type === "number") {
    if (text === "") return { error: "Enter a number." };
    const number = Number(text);
    if (!Number.isInteger(number)) return { error: "Enter a whole number." };
    if (field.min !== undefined && number < field.min) return { error: `Must be at least ${field.min}.` };
    if (field.max !== undefined && number > field.max) return { error: `Must be at most ${field.max}.` };
    return { value: number };
  }

  if (text === "") {
    if (field.required) return { error: "This field is required." };
    if (field.type === "select") return { error: "Choose an option." };
    return { value: "" };
  }
  if (field.maxLength && text.length > field.maxLength) {
    return { error: `Keep it under ${field.maxLength} characters.` };
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) return { error: "Contains characters that cannot be stored." };

  switch (field.type) {
    case "email":
      return isValidEmail(text) ? { value: text.toLowerCase() } : { error: "Enter a valid email address." };
    case "url":
      return ABSOLUTE_URL.test(text) ? { value: text } : { error: "Enter a full address starting with https://." };
    case "link":
      return ABSOLUTE_URL.test(text) || SITE_PATH.test(text)
        ? { value: text }
        : { error: "Enter a path on this site starting with / or a full https:// address." };
    case "select":
      return field.options?.some((option) => option.value === text) ? { value: text } : { error: "Choose an option." };
    case "date": {
      if (!DATE.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) return { error: "Enter a date as YYYY-MM-DD." };
      return { value: text };
    }
    default:
      if (field.pattern && !field.pattern.test(text)) return { error: field.patternHint ?? "This value is not allowed." };
      if (field.type === "text" && /[\r\n]/.test(text)) return { error: "Keep it on one line." };
      return { value: text };
  }
}

export interface ParseContext {
  /** Which Stripe key the server holds, so selling live cannot start by accident. */
  stripeKeyMode: "live" | "test" | "none";
}

export interface ParseResult<S extends Section> {
  value: Settings[S];
  errors: Record<string, string>;
}

/** Reads a submitted form for one section. `errors` is empty when `value` can be saved. */
export function parseSection<S extends Section>(
  section: S,
  raw: Record<string, unknown>,
  context: ParseContext,
): ParseResult<S> {
  const errors: Record<string, string> = {};
  const built: Record<string, unknown> = {};
  for (const field of SECTION_INFO[section].fields) {
    const { value, error } = readField(field, raw[field.name]);
    if (error) errors[field.name] = error;
    else setPath(built, field.name, value);
  }
  const value = fromStored(section, built);

  if (section === "general") {
    const general = value as GeneralSettings;
    if (general.announcement.enabled && !general.announcement.text) {
      errors["announcement.text"] = "Write the announcement before switching it on.";
    }
    if (general.announcement.linkUrl && !general.announcement.linkLabel) {
      errors["announcement.linkLabel"] = "Give the link a text.";
    }
  }

  if (section === "payments") {
    const payments = value as PaymentsSettings;
    if (payments.enabled) {
      if (context.stripeKeyMode === "none") {
        errors.enabled = "No Stripe key is set on Vercel, so there is nothing to accept payments with.";
      } else if (context.stripeKeyMode === "live" && !Object.values(payments.legal).every(Boolean)) {
        errors.enabled = "A live Stripe key is set. Every legal step below must be ticked before selling can start.";
      }
    }
  }

  return { value, errors };
}

/**
 * Reads a stored or submitted object leniently: known keys with the right type
 * are kept, everything else falls back to the default. A row written by an
 * older version of the site can never break the page.
 */
export function fromStored<S extends Section>(section: S, stored: unknown): Settings[S] {
  const result: Record<string, unknown> = {};
  const defaults = flatten(DEFAULTS[section]);
  for (const field of SECTION_INFO[section].fields) {
    const fallback = defaults[field.name];
    const candidate = getPath(stored, field.name);
    let value: string | number | boolean = fallback;
    if (field.type === "toggle") {
      if (typeof candidate === "boolean") value = candidate;
    } else if (field.type === "number") {
      if (typeof candidate === "number" && Number.isInteger(candidate)) value = candidate;
    } else if (typeof candidate === "string") {
      value = candidate;
    }
    setPath(result, field.name, value);
  }
  return result as unknown as Settings[S];
}

/** The names of the fields whose value differs, for the audit log. */
export function changedFields(before: object, after: object): string[] {
  const a = flatten(before);
  const b = flatten(after);
  return Object.keys({ ...a, ...b }).filter((key) => a[key] !== b[key]);
}

export function stripeKeyMode(key: string | undefined): ParseContext["stripeKeyMode"] {
  if (!key) return "none";
  return key.startsWith("sk_live_") ? "live" : "test";
}

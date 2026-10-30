/**
 * The one template every CodeFromScratch email is built on. Written for email
 * clients: tables, inline styles, no web fonts, no external CSS. Everything
 * passed in is escaped, so the letter can never carry raw HTML from a form.
 */

export const SITE_URL = () => process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";

export const REPLY_TO = "office@codefromscratch.org";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const INK = "#0f172a";
const BODY = "#334155";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const ACCENT = "#0f766e";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapes text and turns bare URLs into links. */
function textToHtml(value: string): string {
  return escapeHtml(value).replace(
    /https?:\/\/[^\s<]+[^\s<.,;:!?)]/g,
    (url) => `<a href="${url}" style="color:${ACCENT};">${url}</a>`,
  );
}

/** Blank line = new paragraph, single line break = <br>. */
function noteToHtml(note: string): string {
  return note
    .trim()
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => {
      const html = textToHtml(paragraph.trim()).replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;font:16px/1.65 ${FONT};color:${BODY};">${html}</p>`;
    })
    .join("");
}

export interface LetterCard {
  kicker?: string;
  title: string;
  excerpt?: string;
  meta?: string;
  url: string;
  imageUrl?: string;
  imageAlt?: string;
  cta: string;
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:${ACCENT};"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 22px;font:bold 15px/1.2 ${FONT};color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a></td></tr></table>`;
}

function cardToHtml(card: LetterCard): string {
  const image = card.imageUrl
    ? `<tr><td><a href="${escapeHtml(card.url)}"><img src="${escapeHtml(card.imageUrl)}" width="526" alt="${escapeHtml(card.imageAlt ?? card.title)}" style="display:block;width:100%;max-width:526px;height:auto;border:0;border-radius:10px 10px 0 0;"></a></td></tr>`
    : "";
  const kicker = card.kicker
    ? `<p style="margin:0 0 8px;font:bold 11px/1.4 ${FONT};letter-spacing:1px;text-transform:uppercase;color:${ACCENT};">${escapeHtml(card.kicker)}</p>`
    : "";
  const excerpt = card.excerpt
    ? `<p style="margin:0 0 12px;font:15px/1.6 ${FONT};color:${BODY};">${escapeHtml(card.excerpt)}</p>`
    : "";
  const meta = card.meta
    ? `<p style="margin:0 0 16px;font:13px/1.4 ${FONT};color:${MUTED};">${escapeHtml(card.meta)}</p>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border:1px solid ${LINE};border-radius:10px;border-collapse:separate;">${image}<tr><td style="padding:20px;">${kicker}<h2 style="margin:0 0 10px;font:bold 20px/1.3 ${FONT};color:${INK};"><a href="${escapeHtml(card.url)}" style="color:${INK};text-decoration:none;">${escapeHtml(card.title)}</a></h2>${excerpt}${meta}${button(card.cta, card.url)}</td></tr></table>`;
}

interface ShellOptions {
  title: string;
  preheader?: string;
  bodyHtml: string;
  footerHtml: string;
}

function shell({ title, preheader, bodyHtml, footerHtml }: ShellOptions): string {
  const hidden = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f1f5f9;">${escapeHtml(preheader)}</div>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
${hidden}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;">
<tr><td style="padding:24px 32px 0;"><a href="${SITE_URL()}" style="font:bold 20px/1.2 Georgia,'Times New Roman',serif;color:${INK};text-decoration:none;">Code<span style="color:${ACCENT};font-style:italic;font-weight:normal;">From</span>Scratch</a></td></tr>
<tr><td style="padding:24px 32px 8px;">${bodyHtml}</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid ${LINE};">${footerHtml}</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

const IDENTITY = `CodeFromScratch &middot; Milos Knezevic &middot; Graz, Austria &middot; ${REPLY_TO}`;

function legalLinks(): string {
  const site = SITE_URL();
  return `<a href="${site}/privacy" style="color:${MUTED};">Privacy</a> &middot; <a href="${site}/impressum" style="color:${MUTED};">Impressum</a>`;
}

const smallText = `margin:0 0 8px;font:12px/1.6 ${FONT};color:${MUTED};`;

export interface LetterContent {
  subject: string;
  preheader?: string;
  note?: string;
  card?: LetterCard;
}

/** A letter to a subscriber: note, optional article card, unsubscribe footer. */
export function renderLetter(content: LetterContent, unsubscribeUrl: string): string {
  const bodyHtml = `${content.note ? noteToHtml(content.note) : ""}${content.card ? cardToHtml(content.card) : ""}`;
  const footerHtml = `<p style="${smallText}">You get this email because you subscribed at codefromscratch.org and confirmed it. <a href="${escapeHtml(unsubscribeUrl)}" style="color:${MUTED};">Unsubscribe in one click</a>.</p><p style="${smallText}">${legalLinks()}</p><p style="margin:0;font:12px/1.6 ${FONT};color:${MUTED};">${IDENTITY}</p>`;
  return shell({ title: content.subject, preheader: content.preheader, bodyHtml, footerHtml });
}

/** Plain-text twin of renderLetter. Mail clients and spam filters both want one. */
export function renderLetterText(content: LetterContent, unsubscribeUrl: string): string {
  const parts: string[] = [];
  if (content.note) parts.push(content.note.trim());
  if (content.card) {
    const { title, excerpt, meta, url, cta } = content.card;
    parts.push([title, excerpt, meta, `${cta}: ${url}`].filter(Boolean).join("\n"));
  }
  parts.push(
    `--\nYou get this email because you subscribed at codefromscratch.org and confirmed it.\nUnsubscribe: ${unsubscribeUrl}\nCodeFromScratch · Milos Knezevic · Graz, Austria · ${REPLY_TO}`,
  );
  return parts.join("\n\n");
}

interface NoticeOptions {
  title: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  footnote?: string;
}

/** A one-off notice (confirm your address, already subscribed): same look, no marketing footer. */
export function renderNotice({ title, paragraphs, action, footnote }: NoticeOptions): string {
  const bodyHtml = `<h1 style="margin:0 0 16px;font:bold 22px/1.3 ${FONT};color:${INK};">${escapeHtml(title)}</h1>${paragraphs
    .map((p) => `<p style="margin:0 0 16px;font:16px/1.65 ${FONT};color:${BODY};">${escapeHtml(p)}</p>`)
    .join("")}${action ? `<div style="margin:8px 0 20px;">${button(action.label, action.url)}</div><p style="margin:0 0 16px;font:13px/1.6 ${FONT};color:${MUTED};word-break:break-all;">Or open this link: <a href="${escapeHtml(action.url)}" style="color:${MUTED};">${escapeHtml(action.url)}</a></p>` : ""}${footnote ? `<p style="margin:0 0 16px;font:14px/1.6 ${FONT};color:${MUTED};">${textToHtml(footnote)}</p>` : ""}`;
  const footerHtml = `<p style="${smallText}">${legalLinks()}</p><p style="margin:0;font:12px/1.6 ${FONT};color:${MUTED};">${IDENTITY}</p>`;
  return shell({ title, bodyHtml, footerHtml });
}

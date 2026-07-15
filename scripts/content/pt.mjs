/**
 * Shared Portable Text authoring helpers for the content wave
 * (docs/CONTENT-PLAN.md). Same block shapes as scripts/seed-posts*.mjs,
 * extracted so every part-file imports one implementation, plus `link`
 * for internal cross-linking (rendered by PortableTextRenderer's
 * marks.link).
 */
import { randomUUID } from "crypto";

export const k = () => randomUUID().slice(0, 12);

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function span(text, marks = []) {
  return { _type: "span", _key: k(), text, marks };
}

export function p(text) {
  return { _type: "block", _key: k(), style: "normal", markDefs: [], children: [span(text)] };
}

export function h2(text) {
  return { _type: "block", _key: k(), style: "h2", markDefs: [], children: [span(text)] };
}

export function h3(text) {
  return { _type: "block", _key: k(), style: "h3", markDefs: [], children: [span(text)] };
}

export function code(language, codeText, filename) {
  return { _type: "code", _key: k(), language, code: codeText, filename };
}

export function callout(type, text) {
  return { _type: "callout", _key: k(), type, text };
}

export function bold(text) {
  return span(text, ["strong"]);
}

export function inlineCode(text) {
  return span(text, ["code"]);
}

/** Marker consumed by richP/bulletRich — becomes a span + link markDef. */
export function link(text, href) {
  return { __link: true, text, href };
}

function toChildren(parts, markDefs) {
  return parts.map((part) => {
    if (typeof part === "string") return span(part);
    if (part && part.__link) {
      const defKey = k();
      markDefs.push({ _type: "link", _key: defKey, href: part.href });
      return span(part.text, [defKey]);
    }
    return part;
  });
}

/** Paragraph mixing plain strings, bold()/inlineCode() spans, and link()s. */
export function richP(...parts) {
  const markDefs = [];
  const children = toChildren(parts, markDefs);
  return { _type: "block", _key: k(), style: "normal", markDefs, children };
}

/** Plain-string bullet list. */
export function bullet(items) {
  return items.map((text) => ({
    _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1,
    markDefs: [], children: [span(text)],
  }));
}

/** Bullet list where each item is an array of richP-style parts. */
export function bulletRich(items) {
  return items.map((parts) => {
    const markDefs = [];
    const children = toChildren(parts, markDefs);
    return {
      _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1,
      markDefs, children,
    };
  });
}

/** Numbered list for step-by-step sequences. */
export function numbered(items) {
  return items.map((text) => ({
    _type: "block", _key: k(), style: "normal", listItem: "number", level: 1,
    markDefs: [], children: [span(text)],
  }));
}

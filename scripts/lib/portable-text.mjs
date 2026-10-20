/**
 * Converts the writer-guide block spec (content-drafts/*.json) into Sanity
 * Portable Text. Extracted unchanged from create-inventory-posts.mjs so the
 * publish and check scripts share one converter.
 */

import { randomUUID } from "crypto";

const k = () => randomUUID().slice(0, 12);

export function toPortableText(blocks) {
  const out = [];
  for (const b of blocks) {
    switch (b.t) {
      case "lead":
        out.push({ _type: "lead", _key: k(), text: b.text });
        break;
      case "p": {
        const markDefs = [];
        const children = b.rich
          ? b.rich.map((r) => {
              const marks = [];
              if (r.mark) marks.push(r.mark);
              if (r.href) {
                const defKey = k();
                markDefs.push({ _type: "link", _key: defKey, href: r.href });
                marks.push(defKey);
              }
              return { _type: "span", _key: k(), text: r.text, marks };
            })
          : [{ _type: "span", _key: k(), text: b.text, marks: [] }];
        out.push({
          _type: "block",
          _key: k(),
          style: "normal",
          markDefs,
          children,
        });
        break;
      }
      case "h2":
      case "h3":
        out.push({
          _type: "block",
          _key: k(),
          style: b.t,
          markDefs: [],
          children: [{ _type: "span", _key: k(), text: b.text, marks: [] }],
        });
        break;
      case "code":
        out.push({
          _type: "code",
          _key: k(),
          language: b.language,
          code: b.code,
          ...(b.filename ? { filename: b.filename } : {}),
        });
        break;
      case "callout":
        out.push({ _type: "callout", _key: k(), type: b.calloutType, text: b.text });
        break;
      case "bullet":
        for (const item of b.items) {
          out.push({
            _type: "block",
            _key: k(),
            style: "normal",
            listItem: "bullet",
            level: 1,
            markDefs: [],
            children: [{ _type: "span", _key: k(), text: item, marks: [] }],
          });
        }
        break;
      case "preview":
        out.push({
          _type: "livePreview",
          _key: k(),
          ...(b.title ? { title: b.title } : {}),
          ...(b.html ? { html: b.html } : {}),
          ...(b.css ? { css: b.css } : {}),
          ...(b.js ? { js: b.js } : {}),
          ...(b.height ? { height: b.height } : {}),
        });
        break;
      case "divider":
        out.push({ _type: "divider", _key: k(), style: "plain" });
        break;
      default:
        throw new Error(`Unknown block type: ${b.t}`);
    }
  }
  return out;
}

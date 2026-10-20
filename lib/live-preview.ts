export type PreviewSource = {
  html?: string;
  css?: string;
  js?: string;
};

// The page, not the author's snippet, owns the document shell. The result
// always renders on a light canvas: the frame sits on a white surface in
// both site themes, and a dark colour scheme inside it would turn default
// text white on that white surface.
const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
:root{color-scheme:light;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5}
body{margin:0;padding:16px;background:#fff;color:#111}
`;

/**
 * Closing tags inside inline <style>/<script> text would end the element
 * early and let the rest of the snippet be parsed as HTML. Escaping the
 * slash keeps the text a plain string for the CSS/JS parsers.
 */
function guardInline(text: string, tag: "style" | "script"): string {
  return text.replace(new RegExp(`</(${tag})`, "gi"), "<\\/$1");
}

/** Builds the complete document that runs inside the sandboxed iframe. */
export function buildPreviewDocument({ html = "", css = "", js = "" }: PreviewSource): string {
  const style = `<style>${BASE_CSS}${guardInline(css, "style")}</style>`;
  const script = js.trim() ? `<script>${guardInline(js, "script")}</script>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${style}</head><body>${html}${script}</body></html>`;
}

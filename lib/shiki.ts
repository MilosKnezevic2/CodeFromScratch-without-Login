import { codeToHtml } from "shiki";

let highlighterReady = true;

export async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    const html = await codeToHtml(code, {
      lang: lang || "text",
      theme: "github-dark-default",
    });
    return html;
  } catch {
    // Fallback: return escaped plain text
    return `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
  }
}

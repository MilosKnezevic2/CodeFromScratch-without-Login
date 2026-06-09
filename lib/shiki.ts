import "server-only";
import { codeToHtml } from "shiki";

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

type CodePortableBlock = {
  _type?: string;
  code?: string;
  language?: string;
  highlightedHtml?: string;
};

/**
 * Pre-highlight every `code` block in a Portable Text array on the server.
 * Shiki bundles a ~600 KB WASM regex engine plus grammars — running it in
 * the browser shipped all of that to every reader and burned main-thread
 * time during hydration. Highlighting here means the client renders static
 * HTML and the Shiki payload never leaves the server.
 */
export async function highlightCodeBlocks<T extends CodePortableBlock>(
  blocks: T[],
): Promise<T[]> {
  return Promise.all(
    blocks.map(async (block) =>
      block?._type === "code" && typeof block.code === "string"
        ? {
            ...block,
            highlightedHtml: await highlightCode(
              block.code,
              block.language || "text",
            ),
          }
        : block,
    ),
  );
}

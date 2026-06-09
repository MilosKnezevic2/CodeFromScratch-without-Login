"use client";

import CopyCodeButton from "./CopyCodeButton";

// Highlighting happens on the server (lib/shiki.ts highlightCodeBlocks) and
// arrives here as ready-made HTML. Never import shiki in this file — it drags
// a ~600 KB WASM engine into the client bundle of every article.
export default function CodeBlock({
  code,
  language,
  filename,
  highlightedHtml,
}: {
  code: string;
  language?: string;
  filename?: string;
  highlightedHtml?: string;
}) {
  return (
    <div className="my-6 overflow-hidden rounded-lg border border-[#334155] code-block-wrapper">
      <div className="flex items-center gap-2 bg-[#162032] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400/60" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/60" />
        <span className="h-3 w-3 rounded-full bg-green-400/60" />
        {filename && (
          <span className="ml-2 text-xs text-[#94a3b8]">{filename}</span>
        )}
        {language && !filename && (
          <span className="ml-2 text-xs text-[#94a3b8]">{language}</span>
        )}
        <CopyCodeButton code={code} />
      </div>
      {highlightedHtml ? (
        <div
          className="overflow-x-auto bg-[#1e293b] [&>pre]:!bg-transparent [&>pre]:p-4 [&>pre]:text-sm [&_code]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto bg-[#1e293b] p-4 text-sm">
          <code className="text-[#e6edf3]">{code}</code>
        </pre>
      )}
    </div>
  );
}

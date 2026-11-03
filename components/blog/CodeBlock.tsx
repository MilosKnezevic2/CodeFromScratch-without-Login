"use client";

import { useState } from "react";
import CopyCodeButton from "./CopyCodeButton";
import FullscreenDialog, { FullscreenButton } from "./FullscreenDialog";

// Highlighting happens on the server (lib/shiki.ts highlightCodeBlocks) and
// arrives here as ready-made HTML. Never import shiki in this file — it drags
// a ~600 KB WASM engine into the client bundle of every article.

// Class names are written out in full so Tailwind finds them.
const HTML_CLASS = {
  inline: "overflow-x-auto bg-[#1e293b] [&>pre]:!bg-transparent [&>pre]:p-4 [&>pre]:text-sm [&_code]:!bg-transparent",
  large:
    "h-full overflow-auto bg-[#1e293b] [&>pre]:!bg-transparent [&>pre]:p-4 sm:[&>pre]:p-8 [&>pre]:text-[13px] sm:[&>pre]:text-[15px] [&>pre]:leading-relaxed [&_code]:!bg-transparent",
};
const PRE_CLASS = {
  inline: "overflow-x-auto bg-[#1e293b] p-4 text-sm",
  large: "h-full overflow-auto bg-[#1e293b] p-4 text-[13px] leading-relaxed sm:p-8 sm:text-[15px]",
};

export function CodeView({ code, highlightedHtml, large }: { code: string; highlightedHtml?: string; large?: boolean }) {
  const size = large ? "large" : "inline";
  return highlightedHtml ? (
    <div className={HTML_CLASS[size]} dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
  ) : (
    <pre className={PRE_CLASS[size]}>
      <code className="text-[#e6edf3]">{code}</code>
    </pre>
  );
}

export default function CodeBlock({
  code,
  language,
  filename,
  highlightedHtml,
  fullscreen = true,
}: {
  code: string;
  language?: string;
  filename?: string;
  highlightedHtml?: string;
  /** Off inside a live example, which has its own full-screen view. */
  fullscreen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = filename ?? language;

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-[#334155] code-block-wrapper">
      <div className="flex items-center gap-2 bg-[#162032] px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-red-400/60" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/60" />
        <span className="h-3 w-3 rounded-full bg-green-400/60" />
        {label && <span className="ml-2 text-xs text-[#94a3b8]">{label}</span>}
        <div className="ml-auto flex items-center gap-1">
          <CopyCodeButton code={code} className="" />
          {fullscreen && <FullscreenButton onClick={() => setOpen(true)} label={`Show ${label ?? "the code"} full screen`} />}
        </div>
      </div>
      <CodeView code={code} highlightedHtml={highlightedHtml} />

      {fullscreen && (
        <FullscreenDialog
          open={open}
          onClose={() => setOpen(false)}
          title={filename ?? "Code"}
          meta={language}
          actions={<CopyCodeButton code={code} className="" />}
        >
          <CodeView code={code} highlightedHtml={highlightedHtml} large />
        </FullscreenDialog>
      )}
    </div>
  );
}

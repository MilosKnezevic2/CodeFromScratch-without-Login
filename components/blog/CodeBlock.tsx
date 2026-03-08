"use client";

import { useEffect, useState } from "react";
import CopyCodeButton from "./CopyCodeButton";

function getTheme(): string {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") || "dark";
}

export default function CodeBlock({
  code,
  language,
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        const result = await codeToHtml(code, {
          lang: language || "text",
          theme: "github-dark-default",
        });
        if (!cancelled) setHtml(result);
      } catch {
        // Fallback to plain text
      }
    }

    highlight();
    return () => { cancelled = true; };
  }, [code, language]);

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
      {html ? (
        <div
          className="overflow-x-auto bg-[#1e293b] [&>pre]:!bg-transparent [&>pre]:p-4 [&>pre]:text-sm [&_code]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto bg-[#1e293b] p-4 text-sm">
          <code className="text-[#e6edf3]">{code}</code>
        </pre>
      )}
    </div>
  );
}

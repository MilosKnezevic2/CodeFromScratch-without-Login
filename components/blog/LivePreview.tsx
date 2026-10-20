"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import CodeBlock from "./CodeBlock";
import { buildPreviewDocument } from "@/lib/live-preview";

type Tab = "result" | "html" | "css" | "js";

type Props = {
  title?: string;
  html?: string;
  css?: string;
  js?: string;
  height?: number;
  highlighted?: Partial<Record<"html" | "css" | "js", string>>;
};

const LABELS: Record<Tab, string> = {
  result: "Result",
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
};

const LANGUAGES: Record<Exclude<Tab, "result">, string> = {
  html: "html",
  css: "css",
  js: "js",
};

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 900;
const DEFAULT_HEIGHT = 320;

/**
 * A runnable example inside an article: the visitor sees the working result
 * and the source it came from, in one place, so the two cannot drift apart.
 *
 * The iframe is sandboxed with `allow-scripts allow-forms`. Without
 * `allow-same-origin` it runs on an opaque origin and cannot read the
 * site's cookies, storage or DOM; the page CSP (default-src 'self') also
 * blocks any network request the snippet tries to make. `allow-forms` is
 * needed because a sandboxed form never fires its `submit` event without
 * it, which would make every form demo look dead.
 */
export default function LivePreview({
  title,
  html = "",
  css = "",
  js = "",
  height = DEFAULT_HEIGHT,
  highlighted,
}: Props) {
  const baseId = useId();
  const tabs = useMemo<Tab[]>(() => {
    const list: Tab[] = ["result"];
    if (html.trim()) list.push("html");
    if (css.trim()) list.push("css");
    if (js.trim()) list.push("js");
    return list;
  }, [html, css, js]);
  const [active, setActive] = useState<Tab>("result");
  const [runKey, setRunKey] = useState(0);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const srcDoc = useMemo(() => buildPreviewDocument({ html, css, js }), [html, css, js]);
  const frameHeight = Math.min(Math.max(height, MIN_HEIGHT), MAX_HEIGHT);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.indexOf(active);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    const target = tabs[next];
    setActive(target);
    tabRefs.current[target]?.focus();
  }

  const label = title ?? "Live example";

  return (
    <figure className="my-6 overflow-hidden rounded-lg border border-[#334155]">
      <div className="flex flex-wrap items-center gap-2 bg-[#162032] px-3 py-2">
        <span className="px-1 text-xs font-medium text-[#94a3b8]">{label}</span>
        <div
          role="tablist"
          aria-label={`${label}: result and source`}
          onKeyDown={onKeyDown}
          className="ml-auto flex gap-1"
        >
          {tabs.map((tab) => {
            const selected = tab === active;
            return (
              <button
                key={tab}
                ref={(el) => {
                  tabRefs.current[tab] = el;
                }}
                id={`${baseId}-tab-${tab}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${tab}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab)}
                className={`min-h-9 rounded px-3 py-1 text-xs transition ${
                  selected
                    ? "bg-surface-3 text-foreground"
                    : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                }`}
              >
                {LABELS[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab}
          id={`${baseId}-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab}`}
          hidden={tab !== active}
        >
          {tab === "result" ? (
            <div className="bg-white">
              <iframe
                key={runKey}
                title={`${label}: result`}
                sandbox="allow-scripts allow-forms"
                srcDoc={srcDoc}
                loading="lazy"
                style={{ height: frameHeight }}
                className="block w-full border-0"
              />
              <div className="flex justify-end border-t border-[#334155] bg-[#162032] px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setRunKey((n) => n + 1)}
                  className="min-h-9 rounded px-3 py-1 text-xs text-muted-foreground transition hover:bg-surface-3 hover:text-foreground"
                >
                  Reset example
                </button>
              </div>
            </div>
          ) : (
            <CodeBlock
              code={{ html, css, js }[tab]}
              language={LANGUAGES[tab]}
              highlightedHtml={highlighted?.[tab]}
            />
          )}
        </div>
      ))}
    </figure>
  );
}

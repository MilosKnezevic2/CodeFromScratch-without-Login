"use client";

import { PortableText, PortableTextComponents, PortableTextBlock } from "@portabletext/react";
import { urlFor } from "@/lib/sanity/image";
import { slugify } from "@/lib/portable-text-utils";
import ImageLightbox from "./ImageLightbox";
import CodeBlock from "./CodeBlock";
import HeadingAnchor from "./HeadingAnchor";
import { useRef } from "react";

const sizeWidths: Record<string, number> = {
  small: 400,
  medium: 600,
  full: 800,
};

const sizeClasses: Record<string, string> = {
  small: "max-w-[40%]",
  medium: "max-w-[70%]",
  full: "max-w-full",
};

const alignClasses: Record<string, string> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
};

function getChildText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(getChildText).join("");
  if (children && typeof children === "object" && "props" in children)
    return getChildText((children as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  return "";
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => {
      const text = getChildText(children);
      const id = slugify(text);
      return (
        <div className="mt-16 mb-5">
          <div className="mb-6 h-px bg-gradient-to-r from-transparent via-muted-foreground/40 to-transparent" />
          <h2 id={id} className="group scroll-mt-24 flex items-center gap-3 text-2xl font-bold text-foreground">
            <span className="inline-block h-6 w-1 rounded-full bg-gradient-to-b from-accent to-accent-2" />
            {children}
            <HeadingAnchor id={id} />
          </h2>
        </div>
      );
    },
    h3: ({ children }) => {
      const text = getChildText(children);
      const id = slugify(text);
      return (
        <h3 id={id} className="group mb-4 mt-12 scroll-mt-24 flex items-center text-xl font-semibold text-foreground">
          {children}
          <HeadingAnchor id={id} />
        </h3>
      );
    },
    h4: ({ children }) => {
      const text = getChildText(children);
      const id = slugify(text);
      return (
        <h4 id={id} className="group mb-2 mt-6 scroll-mt-24 flex items-center text-lg font-semibold text-muted">
          {children}
          <HeadingAnchor id={id} />
        </h4>
      );
    },
    normal: ({ children }) => (
      <p className="mb-4 text-base leading-relaxed text-muted">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 rounded-r-lg border-l-4 border-accent bg-accent/5 py-4 pl-5 pr-4 italic text-muted">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc space-y-1 text-muted">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-1 text-muted">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    underline: ({ children }) => <span className="underline">{children}</span>,
    code: ({ children }) => (
      <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm font-mono text-accent">
        {children}
      </code>
    ),
    "strike-through": ({ children }) => <s>{children}</s>,
    highlight: ({ children }) => (
      <mark className="rounded bg-yellow-400/20 px-1 text-yellow-200">{children}</mark>
    ),
    center: ({ children }) => (
      <span className="block text-center">{children}</span>
    ),
    right: ({ children }) => (
      <span className="block text-right">{children}</span>
    ),
    link: ({ children, value }) => {
      const href = value?.href || "#";
      const target = value?.blank ? "_blank" : undefined;
      return (
        <a
          href={href}
          target={target}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
          className="text-accent underline decoration-accent/30 underline-offset-2 transition hover:text-accent-2 hover:decoration-accent-2/50"
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      const size = value.size || "full";
      const alignment = value.alignment || "center";
      const width = sizeWidths[size] || 800;
      return (
        <figure className={`my-6 ${sizeClasses[size] || ""} ${alignClasses[alignment] || "mx-auto"}`}>
          <ImageLightbox
            src={urlFor(value).width(width).url()}
            alt={value.alt || ""}
            className="w-full rounded-lg"
          />
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    code: ({ value }) => (
      <CodeBlock
        code={value.code}
        language={value.language}
        filename={value.filename}
        highlightedHtml={value.highlightedHtml}
      />
    ),
    callout: ({ value }) => {
      const icons: Record<string, string> = {
        info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z",
        tip: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
        error: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
      };
      const styles: Record<string, string> = {
        info: "border-cyan-400 bg-cyan-400/10 text-cyan-300",
        warning: "border-yellow-400 bg-yellow-400/10 text-yellow-300",
        tip: "border-accent bg-accent/10 text-teal-300",
        error: "border-red-400 bg-red-400/10 text-red-300",
      };
      return (
        <div
          className={`my-6 rounded-lg border-l-4 p-4 ${styles[value.type] || styles.info}`}
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icons[value.type] || icons.info} />
            </svg>
            <p className="text-sm font-medium capitalize">{value.type}</p>
          </div>
          <p className="mt-1.5 text-sm">{value.text}</p>
        </div>
      );
    },
    lead: ({ value }) => (
      <aside className="my-6 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2">
          TL;DR
        </p>
        <p className="text-base leading-relaxed text-foreground">{value.text}</p>
      </aside>
    ),
    divider: ({ value }) => {
      const style = value?.style ?? "plain";
      if (style === "decorative") {
        return (
          <div className="my-10 flex items-center justify-center gap-3" role="separator">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-muted-foreground/40" />
            <svg
              className="h-4 w-4 text-muted-foreground/60"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-muted-foreground/40" />
          </div>
        );
      }
      if (style === "dotted") {
        return (
          <hr
            className="my-10 border-0 border-t border-dashed border-muted-foreground/30"
            role="separator"
          />
        );
      }
      return (
        <hr
          className="my-10 border-0 border-t border-border"
          role="separator"
        />
      );
    },
    embed: ({ value }) => {
      const url = typeof value?.url === "string" ? value.url : "";
      const provider = typeof value?.provider === "string" ? value.provider : "iframe";
      const caption = typeof value?.caption === "string" ? value.caption : "";
      const embedSrc = resolveEmbedSrc(provider, url);
      if (!embedSrc) return null;

      const sandbox =
        provider === "twitter"
          ? "allow-scripts allow-same-origin allow-popups"
          : "allow-scripts allow-same-origin allow-popups allow-presentation";

      return (
        <figure className="my-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface-2">
            <iframe
              src={embedSrc}
              title={caption || `${provider} embed`}
              loading="lazy"
              sandbox={sandbox}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
          {caption && (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    },
    table: ({ value }) => {
      const rows = Array.isArray(value?.rows) ? (value.rows as { cells?: string[] }[]) : [];
      if (rows.length === 0) return null;
      const hasHeader = value?.hasHeader !== false;
      const headerRow = hasHeader ? rows[0] : null;
      const bodyRows = hasHeader ? rows.slice(1) : rows;
      const caption = typeof value?.caption === "string" ? value.caption : "";

      return (
        <figure className="my-6 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            {caption && (
              <caption className="border-b border-border bg-surface-2 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                {caption}
              </caption>
            )}
            {headerRow && (
              <thead className="bg-surface-2/50">
                <tr>
                  {(headerRow.cells ?? []).map((cell, ci) => (
                    <th
                      key={ci}
                      scope="col"
                      className="px-4 py-2 text-left font-semibold text-foreground"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className="border-t border-border">
                  {(row.cells ?? []).map((cell, ci) => (
                    <td key={ci} className="px-4 py-2 align-top text-muted">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );
    },
  },
};

function resolveEmbedSrc(provider: string, rawUrl: string): string | null {
  if (!rawUrl) return null;
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  switch (provider) {
    case "youtube": {
      const id =
        url.searchParams.get("v") ??
        (url.hostname.includes("youtu.be")
          ? url.pathname.replace(/^\//, "").split("/")[0]
          : url.pathname.startsWith("/embed/")
            ? url.pathname.replace("/embed/", "").split("/")[0]
            : null);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    case "vimeo": {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    case "twitter": {
      return `https://platform.twitter.com/embed/Tweet.html?url=${encodeURIComponent(rawUrl)}`;
    }
    case "codepen": {
      return rawUrl.replace(/\/pen\//, "/embed/preview/");
    }
    case "codesandbox": {
      return rawUrl.replace(/\/s\//, "/embed/");
    }
    case "iframe": {
      return url.protocol === "https:" ? rawUrl : null;
    }
    default:
      return null;
  }
}

export default function PortableTextRenderer({
  content,
}: {
  content: PortableTextBlock[];
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapperRef} className="prose-dark drop-cap-first">
      <PortableText value={content} components={components} />
    </div>
  );
}

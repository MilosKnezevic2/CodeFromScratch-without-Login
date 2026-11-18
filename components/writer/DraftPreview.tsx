"use client";

import type { PortableTextBlock } from "@portabletext/react";
import { useMemo } from "react";
import PortableTextRenderer from "@/components/blog/PortableTextRenderer";
import { markdownToBlocks } from "@/lib/writer/markdown";

/** A draft rendered with the article page's own renderer, for the editor's review. */
export default function DraftPreview({ title, excerpt, markdown, authorName }: { title: string; excerpt: string; markdown: string; authorName: string }) {
  const blocks = useMemo(() => markdownToBlocks(markdown), [markdown]);
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-background p-5 sm:p-8">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">{title || "Untitled article"}</h1>
      {excerpt && <p className="mt-3 text-lg leading-relaxed text-muted">{excerpt}</p>}
      <p className="mt-3 text-sm text-muted-foreground">By {authorName}</p>
      <div className="prose-editorial mt-8">
        <PortableTextRenderer content={blocks as unknown as PortableTextBlock[]} />
      </div>
    </article>
  );
}

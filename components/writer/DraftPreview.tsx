import type { PortableTextBlock } from "@portabletext/react";
import PortableTextRenderer from "@/components/blog/PortableTextRenderer";
import type { BodyBlock } from "@/lib/writer/body";

/** A draft rendered with the article page's own renderer. */
export default function DraftPreview({ title, excerpt, body, authorName }: { title: string; excerpt: string; body: BodyBlock[]; authorName: string }) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-background p-5 sm:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Preview · as readers will see it</p>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">{title || "Untitled article"}</h1>
      {excerpt && <p className="mt-3 text-lg leading-relaxed text-muted">{excerpt}</p>}
      <p className="mt-3 text-sm text-muted-foreground">By {authorName}</p>
      <div className="prose-editorial mt-8">
        {body.length > 0 ? <PortableTextRenderer content={body as unknown as PortableTextBlock[]} /> : <p className="text-muted">Nothing written yet.</p>}
      </div>
    </article>
  );
}

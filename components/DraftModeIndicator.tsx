import Link from "next/link";

/**
 * Fixed bottom-right badge visible only when Next.js draft mode is
 * enabled. Gives the operator a one-click exit back to the published
 * version of the site. Rendered from the root layout when
 * `draftMode().isEnabled` is true; otherwise not rendered at all.
 */
export default function DraftModeIndicator() {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-3 rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600 shadow-lg backdrop-blur">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
      </span>
      <span>Draft preview</span>
      <Link
        href="/api/draft-mode/disable"
        prefetch={false}
        className="rounded-full border border-amber-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wide hover:bg-amber-500/20"
      >
        Exit
      </Link>
    </div>
  );
}

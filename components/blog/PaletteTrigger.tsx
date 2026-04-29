"use client";

/**
 * Visible trigger for the global ⌘K palette. On desktop it's a
 * subtle pill the user can click instead of the keyboard shortcut;
 * on mobile (where there's no Cmd/Ctrl) it's the primary affordance.
 *
 * Dispatches a synthetic keyboard event the CommandPalette already
 * listens for, so we don't have to plumb open-state through context.
 */
export default function PaletteTrigger({
  className,
}: {
  className?: string;
}) {
  function open() {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      }),
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open search"
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur transition hover:border-accent/50 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className ?? ""}`}
    >
      <svg
        aria-hidden
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <span className="hidden sm:inline">Quick search</span>
      <span className="sm:hidden">Search</span>
      <kbd className="ml-1 hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}

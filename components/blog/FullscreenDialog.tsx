"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * A full-screen view for a code block or a live example, on the native
 * <dialog>: the browser puts it above everything, keeps focus inside, makes
 * the page behind inert and returns focus to the button that opened it.
 * Escape, the Exit button and a click on the dim edge all close it, with a
 * short fade that prefers-reduced-motion turns off. It is rendered into
 * <body>, outside the article, so the article's typography never reaches it;
 * it exists only while open (opening is always a click, so on the client).
 */
export default function FullscreenDialog({
  open,
  onClose,
  title,
  meta,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** A small label beside the title, e.g. the language. */
  meta?: string;
  /** Extra buttons left of Exit, e.g. Copy. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  const close = useCallback(() => {
    const dialog = ref.current;
    if (!dialog?.open || dialog.dataset.closing) return;
    const finish = () => {
      delete dialog.dataset.closing;
      dialog.close();
      onClose();
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return finish();
    dialog.dataset.closing = "true";
    dialog.addEventListener("animationend", finish, { once: true });
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Land on Exit, so Enter or Space right away closes the view again.
      dialog.querySelector<HTMLElement>("[data-fs-exit]")?.focus();
      // The page behind must not scroll under a full-screen view (iOS Safari ignores the dialog for this).
      document.documentElement.style.overflow = "hidden";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        // Escape: play the closing fade instead of the browser's instant close.
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        // A click on the dim edge around the panel lands on the dialog element itself.
        if (e.target === e.currentTarget) close();
      }}
      onClose={onClose}
      className="fs-dialog"
    >
      <div className="fs-panel flex h-full flex-col overflow-hidden rounded-none border-[#334155] bg-[#0f172a] text-[#e2e8f0] shadow-2xl sm:rounded-2xl sm:border">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#334155] bg-[#162032] px-4 py-2.5 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span aria-hidden="true" className="hidden gap-1.5 sm:flex">
              <span className="h-3 w-3 rounded-full bg-red-400/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <span className="h-3 w-3 rounded-full bg-green-400/70" />
            </span>
            <p className="m-0 truncate text-sm font-semibold text-[#e2e8f0]">
              {title}
            </p>
            {meta && (
              <span className="hidden shrink-0 rounded-md bg-[#1e293b] px-2 py-0.5 font-mono text-[11px] text-[#94a3b8] sm:inline">
                {meta}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={close}
              data-fs-exit
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-3 text-xs font-semibold text-[#e2e8f0] transition hover:border-[#2dd4bf]/60 hover:text-white"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
              {/* Short on a phone, where the title needs the room. */}
              <span className="sm:hidden">Exit</span>
              <span className="hidden sm:inline">Exit full screen</span>
              <kbd className="hidden rounded border border-[#334155] px-1.5 py-0.5 font-mono text-[10px] text-[#94a3b8] sm:inline">
                Esc
              </kbd>
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </dialog>,
    document.body,
  );
}

/** The button that opens the full-screen view, sized to sit in a code block's title bar. */
export function FullscreenButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title="Full screen"
      className="inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded px-2 text-xs text-muted-foreground transition hover:bg-surface-3 hover:text-foreground"
    >
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
      <span className="hidden sm:inline">Full screen</span>
    </button>
  );
}

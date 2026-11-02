"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * An article image with real dimensions (no layout jump) that opens full
 * size on click. A native <dialog> brings the focus trap, the Escape key and
 * the backdrop with it; CSS does the fade (see .lightbox in globals.css).
 * The thumbnail is a button, so the keyboard can open it too, and the large
 * copy is requested only once the dialog opens.
 */
export default function ImageLightbox({
  src,
  alt,
  width,
  height,
  sizes,
  unoptimized,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  /** Formats the image optimizer must pass through untouched (svg, gif). */
  unoptimized?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt ? `View larger: ${alt}` : "View image larger"}
        className="block w-full cursor-zoom-in rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          unoptimized={unoptimized}
          className={`h-auto ${className || ""}`}
        />
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        // A click on the dialog itself is a click beside the image.
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        aria-label={alt || "Image"}
        className="lightbox fixed inset-0 m-0 hidden h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-transparent p-8 outline-none open:flex"
      >
        {open && (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="90vw"
            // The dialog just opened on a tap: fetch at once, not when the lazy observer gets round to it.
            loading="eager"
            unoptimized={unoptimized}
            className="h-auto w-auto max-h-[90dvh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </dialog>
    </>
  );
}

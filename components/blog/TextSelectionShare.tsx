"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TextSelectionShare({ slug }: { slug: string }) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length < 10) {
      setSelection(null);
      return;
    }

    const range = sel?.getRangeAt(0);
    if (!range) return;

    const rect = range.getBoundingClientRect();
    setSelection({
      text: text.slice(0, 280),
      x: rect.left + rect.width / 2,
      y: rect.top - 10 + window.scrollY,
    });
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  useEffect(() => {
    function handleClick() {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel?.toString().trim()) setSelection(null);
      }, 10);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!selection) return null;

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/blog/${slug}`
    : "";
  const encodedText = encodeURIComponent(`"${selection.text}"`);
  const encodedUrl = encodeURIComponent(url);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className="fixed z-[80] flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 shadow-xl"
        style={{
          left: selection.x,
          top: selection.y,
          transform: "translate(-50%, -100%)",
        }}
      >
        <span className="text-xs font-medium text-muted-foreground mr-1">Share</span>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 w-7 items-center justify-center rounded text-muted transition hover:bg-surface-2 hover:text-accent"
          title="Share on X"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(selection.text);
            setSelection(null);
          }}
          className="flex h-7 w-7 items-center justify-center rounded text-muted transition hover:bg-surface-2 hover:text-accent"
          title="Copy quote"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

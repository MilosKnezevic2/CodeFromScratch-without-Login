"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useRef } from "react";
import type { SearchResult } from "./SearchPanel";

/**
 * The dialog carries the animation library and the result list, which most
 * visitors never open. It is fetched the first time the search opens and
 * stays mounted afterwards so the closing animation still plays.
 */
const SearchPanel = dynamic(() => import("./SearchPanel"), { ssr: false });

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Clear the search when the modal closes (adjusted while rendering instead
  // of in an effect that sets state).
  const [prevOpen, setPrevOpen] = useState(false);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setEverOpened(true);
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }

  useEffect(() => {
    if (!open) return;
    // The panel may still be downloading on the first open; keep trying briefly.
    let attempts = 0;
    const t = setInterval(() => {
      attempts += 1;
      if (inputRef.current) {
        inputRef.current.focus();
        clearInterval(t);
      } else if (attempts > 20) {
        clearInterval(t);
      }
    }, 100);
    return () => clearInterval(t);
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function onInput(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  return (
    <>
      {/* Search trigger in navbar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="hidden items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-sm text-muted transition hover:border-accent/30 hover:text-foreground sm:flex"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search...
        <kbd className="ml-2 rounded border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      {everOpened && (
        <SearchPanel
          open={open}
          query={query}
          results={results}
          loading={loading}
          inputRef={inputRef}
          onInput={onInput}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

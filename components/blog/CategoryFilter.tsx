"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CategoryWithCount, TagWithCategory } from "@/lib/sanity/queries";

const MAX_PILLS = 6;

export default function CategoryFilter({
  categories,
  tags,
  activeCategory,
  activeTag,
  activeCategoryLabel,
  searchQuery,
}: {
  categories: CategoryWithCount[];
  tags: TagWithCategory[];
  activeCategory: string;
  activeTag: string;
  activeCategoryLabel?: string;
  activeTagLabel?: string;
  searchQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const topCategories = categories.slice(0, MAX_PILLS);
  const hasMore = categories.length > MAX_PILLS;
  const activeInTop = topCategories.some((c) => c.slug.current === activeCategory);

  const filteredDropdown = categories.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // Only show tags when a category is selected
  const categoryTags = activeCategory
    ? tags.filter((t) => t.categorySlug === activeCategory)
    : [];

  function onSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`/blog?${params.toString()}`);
    }, 400);
  }

  function clearSearch() {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`/blog?${params.toString()}`);
    searchInputRef.current?.focus();
  }

  function selectCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    params.delete("tag");
    params.delete("page");
    router.push(`/blog?${params.toString()}`);
    setDropdownOpen(false);
    setSearch("");
  }

  function selectTag(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("tag", slug);
    } else {
      params.delete("tag");
    }
    params.delete("page");
    router.push(`/blog?${params.toString()}`);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", onClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [dropdownOpen]);

  return (
    <div className="relative z-[100] mt-8 space-y-4">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search articles by title, excerpt, or keyword..."
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => selectCategory("")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !activeCategory
              ? "bg-accent text-[#0f172a]"
              : "border border-border bg-surface text-muted-foreground hover:border-accent/30 hover:text-foreground"
          }`}
        >
          All
        </button>

        {topCategories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => selectCategory(cat.slug.current)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeCategory === cat.slug.current
                ? "bg-accent text-[#0f172a]"
                : "border border-border bg-surface text-muted-foreground hover:border-accent/30 hover:text-foreground"
            }`}
          >
            {cat.title}
            <span className="ml-1.5 text-[10px] opacity-60">{cat.postCount}</span>
          </button>
        ))}

        {activeCategory && !activeInTop && activeCategoryLabel && (
          <button
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-[#0f172a] transition"
          >
            {activeCategoryLabel}
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                selectCategory("");
              }}
              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0f172a]/20 text-[10px] leading-none hover:bg-[#0f172a]/40"
            >
              &times;
            </span>
          </button>
        )}

        {hasMore && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-accent/30 hover:text-foreground"
            >
              More
              <svg
                className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full z-[200] mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
                <div className="border-b border-border p-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {filteredDropdown.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No categories found
                    </p>
                  ) : (
                    filteredDropdown.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => selectCategory(cat.slug.current)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                          activeCategory === cat.slug.current
                            ? "bg-accent/10 text-accent"
                            : "text-foreground hover:bg-surface-2"
                        }`}
                      >
                        <span>{cat.title}</span>
                        <span className="text-xs text-muted-foreground">{cat.postCount}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags — only appear when a category is selected */}
      {categoryTags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-3">
          <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Filter by tag
          </span>
          {categoryTags.map((tag) => (
            <button
              key={tag._id}
              onClick={() =>
                activeTag === tag.slug.current
                  ? selectTag("")
                  : selectTag(tag.slug.current)
              }
              className={`cursor-pointer rounded-full px-3.5 py-1 text-xs font-medium transition ${
                activeTag === tag.slug.current
                  ? "bg-accent text-[#0f172a]"
                  : "border border-border bg-surface text-muted-foreground hover:border-accent/30 hover:text-accent"
              }`}
            >
              # {tag.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

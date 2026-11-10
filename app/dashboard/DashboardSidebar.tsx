"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import type { DeskFolder } from "@/lib/reader/desk";
import { fileArticle } from "./actions";

/** The library's cards carry this type when dragged; nothing else on the page does. */
const DRAG_TYPE = "text/x-cfs-article";

const ICONS = {
  home: <path d="M3 10.5 12 3l9 7.5V21H3zM9 21v-7h6v7" />,
  library: <path d="M6 3h12v18l-6-4-6 4z" />,
  progress: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
};

const LINKS = [
  { href: "/dashboard", label: "Home", icon: ICONS.home },
  { href: "/dashboard/saved", label: "Library", icon: ICONS.library },
  { href: "/dashboard/reading", label: "Progress", icon: ICONS.progress },
  { href: "/dashboard/account", label: "Profile and settings", short: "Profile", icon: ICONS.profile },
] as const;

export default function DashboardSidebar({ folders, savedCount }: { folders: DeskFolder[]; savedCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeFolder = useSearchParams().get("folder");
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropped, setDropped] = useState<string | null>(null);
  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  return (
    <>
      {/* Phone and tablet: one row of pills that scrolls sideways. */}
      <nav aria-label="Your dashboard" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-2 pb-1">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition ${
                  isActive(l.href) ? "border-accent bg-accent font-bold text-accent-foreground" : "border-border text-muted hover:text-foreground"
                }`}
              >
                {"short" in l ? l.short : l.label}
                {l.href === "/dashboard/saved" && savedCount > 0 && <span className="font-mono text-xs opacity-80">{savedCount}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop: the reading desk's side menu. */}
      <aside className="hidden w-60 shrink-0 flex-col gap-8 lg:flex">
        <nav aria-label="Your dashboard">
          <ul className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) && !activeFolder ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm transition ${
                    isActive(l.href) && !activeFolder ? "bg-accent/12 font-bold text-foreground" : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive(l.href) && !activeFolder ? "text-accent" : ""}>
                    {l.icon}
                  </svg>
                  <span className="flex-1">{l.label}</span>
                  {l.href === "/dashboard/saved" && savedCount > 0 && <span className="font-mono text-xs text-muted-foreground">{savedCount}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-2 px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Folders</p>
          <ul className="flex flex-col gap-0.5">
            {folders.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/dashboard/saved?folder=${f.id}`}
                  aria-current={activeFolder === f.id ? "page" : undefined}
                  onDragOver={(e) => {
                    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                    setDropTarget(f.id);
                  }}
                  onDragLeave={() => setDropTarget((t) => (t === f.id ? null : t))}
                  onDrop={async (e) => {
                    const slug = e.dataTransfer.getData(DRAG_TYPE);
                    setDropTarget(null);
                    if (!slug) return;
                    e.preventDefault();
                    const result = await fileArticle(slug, f.id, true);
                    if (result.ok) {
                      setDropped(f.name);
                      router.refresh();
                    }
                  }}
                  className={`flex min-h-10 items-center gap-3 rounded-xl px-3.5 text-sm transition ${
                    dropTarget === f.id
                      ? "bg-accent/20 text-foreground ring-2 ring-accent"
                      : activeFolder === f.id
                        ? "bg-accent/12 font-bold text-foreground"
                        : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: f.hex }} />
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{f.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/saved?new=folder" className="mt-1 flex min-h-10 items-center px-3.5 text-sm text-accent hover:underline">
            + New folder
          </Link>
          <p aria-live="polite" className="px-3.5 text-xs text-muted-foreground">
            {dropped ? `Added to ${dropped}.` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="self-start rounded-xl px-3.5 py-2.5 text-sm text-muted transition hover:text-foreground"
        >
          Log out
        </button>
      </aside>
    </>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSavedPosts } from "./SavedPostsProvider";

type Collection = {
  id: string;
  name: string;
  _count: { savedPosts: number };
};

export default function SavePostButton({
  postSlug,
  iconOnly = false,
}: {
  postSlug: string;
  iconOnly?: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { savedPosts, ensureLoaded, updateLocal } = useSavedPosts();

  useEffect(() => {
    if (session) ensureLoaded();
  }, [session, ensureLoaded]);

  const match = useMemo(
    () => savedPosts.find((p) => p.postSlug === postSlug),
    [savedPosts, postSlug]
  );
  const saved = !!match;
  const savedPostId = match?.id ?? null;
  const activeCollectionIds = useMemo(
    () => new Set(match?.collections.map((c) => c.collectionId) ?? []),
    [match]
  );

  const [loading, setLoading] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click (only used in non-iconOnly mode)
  useEffect(() => {
    if (!showPopover) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopover]);

  const fetchCollections = useCallback(async () => {
    const res = await fetch("/api/user/collections");
    if (res.ok) setCollections(await res.json());
  }, []);

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/user/saved-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postSlug }),
    });
    const savedPost = await res.json();
    updateLocal((prev) => [
      { id: savedPost.id, postSlug, collections: [] },
      ...prev,
    ]);
    setLoading(false);

    // Show collection popover after saving (only on full button)
    if (!iconOnly) {
      await fetchCollections();
      setShowPopover(true);
    }
  }

  async function handleUnsave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    await fetch("/api/user/saved-posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postSlug }),
    });
    updateLocal((prev) => prev.filter((p) => p.postSlug !== postSlug));
    setShowPopover(false);
    setLoading(false);
  }

  async function handleFullButtonClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push("/login");
      return;
    }

    if (saved) {
      // Toggle popover
      if (showPopover) {
        setShowPopover(false);
      } else {
        await fetchCollections();
        setShowPopover(true);
      }
      return;
    }

    await handleSave(e);
  }

  async function handleIconClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push("/login");
      return;
    }

    if (saved) {
      await handleUnsave(e);
    } else {
      await handleSave(e);
    }
  }

  async function toggleCollection(collectionId: string) {
    if (!savedPostId) return;

    const isActive = activeCollectionIds.has(collectionId);
    updateLocal((prev) =>
      prev.map((p) => {
        if (p.id !== savedPostId) return p;
        return {
          ...p,
          collections: isActive
            ? p.collections.filter((c) => c.collectionId !== collectionId)
            : [...p.collections, { collectionId }],
        };
      })
    );

    if (isActive) {
      await fetch(`/api/user/collections/${collectionId}/posts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedPostId }),
      });
    } else {
      await fetch(`/api/user/collections/${collectionId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedPostId }),
      });
    }
  }

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !savedPostId) return;

    setCreatingCollection(true);
    const res = await fetch("/api/user/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const collection = await res.json();

    await fetch(`/api/user/collections/${collection.id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedPostId }),
    });

    setCollections((prev) => [{ ...collection, _count: { savedPosts: 1 } }, ...prev]);
    updateLocal((prev) =>
      prev.map((p) => {
        if (p.id !== savedPostId) return p;
        return { ...p, collections: [...p.collections, { collectionId: collection.id }] };
      })
    );
    setNewName("");
    setCreatingCollection(false);
  }

  // Content-first launch: accounts are not offered publicly, so a save
  // button for a signed-out visitor is a dead end into a hidden /login.
  // Render nothing without a session; signed-in users (dev branch and the
  // future SaaS relaunch) get the full behaviour unchanged.
  if (!session) return null;

  // --- Icon-only mode: simple save/unsave toggle, no popover ---
  // Visible chrome by default — solid pill background + subtle ring
  // so it reads as a real button at every state. Slight opacity dip
  // when not hovered so it does not fight the editorial composition;
  // clicks through full opacity on hover/focus.
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleIconClick}
        disabled={loading}
        aria-pressed={saved}
        aria-label={saved ? "Unsave post" : "Save post"}
        className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 backdrop-blur-md transition-all duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          saved
            ? "bg-accent text-accent-foreground ring-accent shadow-lg shadow-accent/20"
            : "bg-background/80 text-foreground ring-border opacity-80 hover:bg-background hover:opacity-100 hover:ring-foreground/40 group-hover:opacity-100"
        }`}
        title={saved ? "Unsave" : "Save post"}
      >
        <svg
          className="h-4 w-4"
          fill={saved ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>
    );
  }

  // --- Full mode: save button + collection popover ---
  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={handleFullButtonClick}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
          saved
            ? "border-accent/30 bg-accent/10 text-accent"
            : "border-border text-muted hover:border-accent/50 hover:text-accent"
        }`}
      >
        <svg
          className="h-4 w-4"
          fill={saved ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>

      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-surface p-3 shadow-xl"
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Add to collection
          </p>

          {collections.length > 0 ? (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {collections.map((col) => (
                <label
                  key={col.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    checked={activeCollectionIds.has(col.id)}
                    onChange={() => toggleCollection(col.id)}
                    className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="truncate">{col.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="py-2 text-xs text-muted-foreground">No collections yet</p>
          )}

          <form onSubmit={handleCreateCollection} className="mt-2 flex gap-1.5 border-t border-border pt-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection..."
              className="flex-1 rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={creatingCollection || !newName.trim()}
              className="rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/20 disabled:opacity-50"
            >
              Add
            </button>
          </form>

          <button
            onClick={handleUnsave}
            disabled={loading}
            className="mt-2 w-full rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition hover:border-red-400/50 hover:text-red-400"
          >
            Unsave post
          </button>
        </div>
      )}
    </div>
  );
}

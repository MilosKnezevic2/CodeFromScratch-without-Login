"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useSession } from "next-auth/react";

export type SavedEntry = { slug: string; folderIds: string[] };
export type Folder = { id: string; name: string };

type Library = {
  saved: SavedEntry[];
  folders: Folder[];
  loaded: boolean;
  /** Loads the library once, the first time a save button needs it. */
  ensureLoaded: () => void;
  refetch: () => Promise<void>;
  /** Optimistic local change; the next refetch corrects it if the server disagreed. */
  update: (fn: (prev: { saved: SavedEntry[]; folders: Folder[] }) => { saved: SavedEntry[]; folders: Folder[] }) => void;
};

const LibraryContext = createContext<Library>({
  saved: [],
  folders: [],
  loaded: false,
  ensureLoaded: () => {},
  refetch: async () => {},
  update: () => {},
});

export function useSavedPosts() {
  return useContext(LibraryContext);
}

/**
 * The signed-in reader's saved articles and folders, shared by every save
 * button on a page so a listing of twenty cards makes one request, not twenty.
 * Nothing is fetched for visitors who are not signed in.
 */
export default function SavedPostsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [state, setState] = useState<{ saved: SavedEntry[]; folders: Folder[] }>({ saved: [], folders: [] });
  const [loaded, setLoaded] = useState(false);
  const fetched = useRef(false);

  const refetch = useCallback(async () => {
    if (status !== "authenticated") {
      setLoaded(true);
      return;
    }
    try {
      const res = await fetch("/api/me/saved", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { saved: SavedEntry[]; folders: Folder[] };
        setState({ saved: data.saved, folders: data.folders });
      }
    } finally {
      setLoaded(true);
    }
  }, [status]);

  const ensureLoaded = useCallback(() => {
    if (fetched.current || status !== "authenticated") return;
    fetched.current = true;
    void refetch();
  }, [refetch, status]);

  return (
    <LibraryContext.Provider value={{ ...state, loaded, ensureLoaded, refetch, update: setState }}>
      {children}
    </LibraryContext.Provider>
  );
}

"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

type SavedPost = {
  id: string;
  postSlug: string;
  collections: { collectionId: string }[];
};

type SavedPostsContextType = {
  savedPosts: SavedPost[];
  isLoaded: boolean;
  ensureLoaded: () => void;
  refetch: () => Promise<void>;
  updateLocal: (fn: (prev: SavedPost[]) => SavedPost[]) => void;
};

const SavedPostsContext = createContext<SavedPostsContextType>({
  savedPosts: [],
  isLoaded: false,
  ensureLoaded: () => {},
  refetch: async () => {},
  updateLocal: () => {},
});

export function useSavedPosts() {
  return useContext(SavedPostsContext);
}

export default function SavedPostsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const fetchedRef = useRef(false);

  const refetch = useCallback(async () => {
    if (!session) {
      setSavedPosts([]);
      setIsLoaded(true);
      return;
    }
    const res = await fetch("/api/user/saved-posts");
    if (res.ok) {
      setSavedPosts(await res.json());
    }
    setIsLoaded(true);
  }, [session]);

  const ensureLoaded = useCallback(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refetch();
  }, [refetch]);

  const updateLocal = useCallback((fn: (prev: SavedPost[]) => SavedPost[]) => {
    setSavedPosts(fn);
  }, []);

  return (
    <SavedPostsContext.Provider value={{ savedPosts, isLoaded, ensureLoaded, refetch, updateLocal }}>
      {children}
    </SavedPostsContext.Provider>
  );
}

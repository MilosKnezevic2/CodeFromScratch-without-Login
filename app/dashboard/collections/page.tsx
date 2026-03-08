"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  _count: { savedPosts: number };
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    const res = await fetch("/api/user/collections");
    const data = await res.json();
    setCollections(data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    await fetch("/api/user/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    setNewName("");
    fetchCollections();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/user/collections/${id}`, {
      method: "DELETE",
    });
    fetchCollections();
  }

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Collections</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New collection name..."
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <button
          type="submit"
          className="cta-glow rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Create
        </button>
      </form>

      {collections.length === 0 ? (
        <p className="text-muted">No collections yet. Create one above.</p>
      ) : (
        <ul className="space-y-3">
          {collections.map((col) => (
            <li
              key={col.id}
              className="card-glow flex items-center justify-between rounded-xl border border-border bg-surface/80 backdrop-blur-xl px-5 py-4"
            >
              <Link href={`/dashboard/collections/${col.id}`} className="flex-1 py-1 text-sm font-medium text-foreground hover:text-accent transition">
                {col.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {col._count.savedPosts} posts
                </span>
              </Link>
              <button
                onClick={() => handleDelete(col.id)}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

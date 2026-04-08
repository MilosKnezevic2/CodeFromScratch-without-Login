"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const reactions = [
  { type: "helpful", emoji: "\u{1F44D}", label: "Helpful" },
  { type: "love", emoji: "\u{2764}\u{FE0F}", label: "Love it" },
  { type: "insightful", emoji: "\u{1F4A1}", label: "Insightful" },
  { type: "mindblowing", emoji: "\u{1F680}", label: "Mind-blowing" },
];

interface PostReactionsProps {
  slug: string;
}

export default function PostReactions({ slug }: PostReactionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${slug}/react`)
      .then((r) => r.json())
      .then((data) => setCounts(data.counts || {}))
      .catch(() => {});
  }, [slug]);

  const handleReact = useCallback(
    async (type: string) => {
      if (loading) return;
      setLoading(true);

      // Optimistic update
      const wasSelected = selected === type;
      const prevCounts = { ...counts };
      const prevSelected = selected;

      if (wasSelected) {
        setSelected(null);
        setCounts((c) => ({ ...c, [type]: Math.max(0, (c[type] || 0) - 1) }));
      } else {
        if (selected) {
          setCounts((c) => ({
            ...c,
            [selected]: Math.max(0, (c[selected] || 0) - 1),
            [type]: (c[type] || 0) + 1,
          }));
        } else {
          setCounts((c) => ({ ...c, [type]: (c[type] || 0) + 1 }));
        }
        setSelected(type);
      }

      try {
        const res = await fetch(`/api/posts/${slug}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        const data = await res.json();
        if (data.counts) setCounts(data.counts);
      } catch {
        // Rollback on error
        setCounts(prevCounts);
        setSelected(prevSelected);
      } finally {
        setLoading(false);
      }
    },
    [slug, selected, counts, loading]
  );

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="text-sm font-medium text-muted-foreground">
        {selected
          ? "Thanks for your feedback!"
          : totalReactions > 0
            ? `${totalReactions} reader${totalReactions !== 1 ? "s" : ""} reacted`
            : "Was this article helpful?"}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {reactions.map((r) => {
          const count = counts[r.type] || 0;
          const isSelected = selected === r.type;

          return (
            <motion.button
              key={r.type}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReact(r.type)}
              disabled={loading}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
                isSelected
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:border-accent/30 hover:text-foreground"
              } ${loading ? "opacity-60" : ""}`}
            >
              <span className="text-base">{r.emoji}</span>
              {r.label}
              {count > 0 && (
                <span className={`ml-0.5 text-xs font-semibold ${isSelected ? "text-accent" : "text-muted-foreground"}`}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

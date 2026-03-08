"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const reactions = [
  { emoji: "\u{1F44D}", label: "Helpful" },
  { emoji: "\u{2764}\u{FE0F}", label: "Love it" },
  { emoji: "\u{1F4A1}", label: "Insightful" },
  { emoji: "\u{1F680}", label: "Mind-blowing" },
];

export default function PostReactions() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="text-sm font-medium text-muted-foreground">
        {selected ? "Thanks for your feedback!" : "Was this article helpful?"}
      </p>
      <div className="flex items-center gap-2">
        {reactions.map((r) => (
          <motion.button
            key={r.label}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelected(r.label)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
              selected === r.label
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:border-accent/30 hover:text-foreground"
            }`}
          >
            <span className="text-base">{r.emoji}</span>
            {r.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

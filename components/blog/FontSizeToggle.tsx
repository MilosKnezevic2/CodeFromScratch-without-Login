"use client";

import { useEffect, useState } from "react";

const sizes = [
  { label: "A", key: "small", scale: "0.9" },
  { label: "A", key: "medium", scale: "1" },
  { label: "A", key: "large", scale: "1.15" },
];

export default function FontSizeToggle() {
  const [active, setActive] = useState("medium");

  useEffect(() => {
    const saved = localStorage.getItem("blog-font-size");
    if (saved) setActive(saved);
  }, []);

  useEffect(() => {
    const el = document.getElementById("article-content");
    if (!el) return;

    const size = sizes.find((s) => s.key === active);
    if (size) {
      el.style.setProperty("--article-scale", size.scale);
    }
    localStorage.setItem("blog-font-size", active);
  }, [active]);

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
      {sizes.map((s, i) => (
        <button
          key={s.key}
          onClick={() => setActive(s.key)}
          className={`flex h-7 items-center justify-center rounded px-2 transition ${
            i === 0 ? "text-xs" : i === 2 ? "text-base" : "text-sm"
          } ${
            active === s.key
              ? "bg-accent/10 font-medium text-accent"
              : "text-muted hover:text-foreground"
          }`}
          title={`${s.key} text`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

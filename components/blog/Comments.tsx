"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

const GISCUS_REPO = process.env.NEXT_PUBLIC_GISCUS_REPO || "";
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "";
const GISCUS_CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "Blog Comments";
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "";

export default function Comments() {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const isConfigured = GISCUS_REPO && GISCUS_REPO_ID && GISCUS_CATEGORY_ID;

  useEffect(() => {
    if (!ref.current || !isConfigured) return;

    const existing = ref.current.querySelector(".giscus");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", GISCUS_REPO);
    script.setAttribute("data-repo-id", GISCUS_REPO_ID);
    script.setAttribute("data-category", GISCUS_CATEGORY);
    script.setAttribute("data-category-id", GISCUS_CATEGORY_ID);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", resolvedTheme === "dark" ? "dark_dimmed" : "light");
    script.setAttribute("data-lang", "en");
    script.setAttribute("data-loading", "lazy");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    ref.current.appendChild(script);
  }, [resolvedTheme, isConfigured]);

  if (!isConfigured) return null;

  return (
    <section className="mt-12 border-t border-border pt-12">
      <h2 className="mb-6 text-xl font-bold text-foreground">Comments</h2>
      <div ref={ref} />
    </section>
  );
}

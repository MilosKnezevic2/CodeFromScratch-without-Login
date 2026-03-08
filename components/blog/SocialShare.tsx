"use client";

import { useState } from "react";

interface SocialShareProps {
  url: string;
  title: string;
}

export default function SocialShare({ url, title }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:border-accent/50 hover:text-accent transition"
      >
        Twitter
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:border-accent/50 hover:text-accent transition"
      >
        LinkedIn
      </a>
      <button
        onClick={copyLink}
        className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:border-accent/50 hover:text-accent transition"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}

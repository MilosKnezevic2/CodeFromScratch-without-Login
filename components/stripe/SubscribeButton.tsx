"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SubscribeButtonProps {
  priceId: string;
  highlighted?: boolean;
}

export default function SubscribeButton({ priceId, highlighted }: SubscribeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!session) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode: "subscription" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
        highlighted
          ? "bg-indigo-600 text-white hover:bg-indigo-700"
          : "border border-border text-muted hover:bg-surface-2"
      }`}
    >
      {loading ? "Loading..." : "Subscribe"}
    </button>
  );
}

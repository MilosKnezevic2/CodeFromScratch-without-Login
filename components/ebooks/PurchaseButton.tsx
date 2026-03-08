"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PurchaseButtonProps {
  ebookId: string;
  stripePriceId: string | null;
  price: number;
  freeWithPro: boolean;
}

export default function PurchaseButton({
  ebookId,
  stripePriceId,
  price,
  freeWithPro,
}: PurchaseButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isPro = session?.user?.plan === "PRO";
  const hasAccess = isPro && freeWithPro;

  if (hasAccess) {
    return (
      <a
        href={`/api/user/ebooks/${ebookId}/download`}
        className="inline-block rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
      >
        Download (Included with Pro)
      </a>
    );
  }

  async function handlePurchase() {
    if (!session) {
      router.push("/login");
      return;
    }

    if (!stripePriceId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: stripePriceId,
          mode: "payment",
          ebookId,
        }),
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
      onClick={handlePurchase}
      disabled={loading || !stripePriceId}
      className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {loading ? "Loading..." : `Buy for $${(price / 100).toFixed(2)}`}
    </button>
  );
}

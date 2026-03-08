"use client";

import SubscribeButton from "./SubscribeButton";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted: boolean;
  priceId: string | null;
}

export default function PricingCard({
  name,
  price,
  period,
  features,
  highlighted,
  priceId,
}: PricingCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        highlighted
          ? "border-indigo-500 bg-surface shadow-lg ring-1 ring-indigo-500"
          : "border-border bg-surface shadow-sm"
      }`}
    >
      {highlighted && (
        <span className="mb-4 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
          Most Popular
        </span>
      )}
      <h3 className="text-lg font-semibold text-foreground">{name}</h3>
      <div className="mt-2">
        <span className="text-3xl font-bold text-foreground">{price}</span>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {priceId ? (
          <SubscribeButton priceId={priceId} highlighted={highlighted} />
        ) : (
          <button
            disabled
            className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground"
          >
            Current Plan
          </button>
        )}
      </div>
    </div>
  );
}

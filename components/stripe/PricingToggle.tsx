"use client";

import { useState } from "react";
import Link from "next/link";

type BillingPeriod = "monthly" | "annual";

const plans = [
  {
    name: "Free",
    description: "Start learning with free articles and community access.",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Access to all free articles",
      "Save posts to collections",
      "Newsletter subscription",
      "Community access",
      "Purchase ebooks & courses individually",
    ],
    highlighted: false,
    cta: "Get Started",
    ctaHref: "/register",
  },
  {
    name: "Pro",
    description: "Unlock every premium article and early access content.",
    monthlyPrice: 9,
    annualPrice: 86,
    features: [
      "Everything in Free",
      "Access to all premium articles",
      "Early access to new content",
      "Ad-free reading experience",
      "Priority support",
      "Purchase ebooks & courses individually",
    ],
    highlighted: true,
    cta: "Upgrade to Pro",
    ctaHref: "/register",
  },
  {
    name: "Pro+",
    description: "The full experience — premium content, every ebook & course included.",
    monthlyPrice: 19,
    annualPrice: 182,
    features: [
      "Everything in Pro",
      "All ebooks included for free",
      "All courses included for free",
      "Exclusive code repos & starter kits",
      "Members-only content drops",
    ],
    highlighted: false,
    cta: "Go Pro+",
    ctaHref: "/register",
  },
];

export default function PricingToggle() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  return (
    <div>
      {/* Toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <button
          onClick={() => setBilling("monthly")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            billing === "monthly"
              ? "bg-accent/10 text-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            billing === "annual"
              ? "bg-accent/10 text-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Annual
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
            Save 20%
          </span>
        </button>
      </div>

      {/* Cards */}
      <div className="grid items-start gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          const perMonth = billing === "annual" ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;

          return (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition ${
                plan.highlighted
                  ? "scale-[1.02] border-accent bg-surface shadow-2xl shadow-accent/10 ring-1 ring-accent md:scale-105"
                  : "border-border bg-surface shadow-lg"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-accent px-4 py-1 text-xs font-bold text-[#0f172a] shadow-md">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.description}</p>
              </div>

              <div className="mb-6">
                {price === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-foreground">$0</span>
                    <span className="text-sm text-muted-foreground">forever</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight text-foreground">
                        ${billing === "monthly" ? price : perMonth}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    {billing === "annual" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        ${price} billed annually
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-6 h-px bg-border" />

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        plan.highlighted ? "text-accent" : "text-green-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block w-full rounded-xl px-5 py-3 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? "cta-glow"
                    : "border border-border text-foreground hover:border-accent/50 hover:text-accent"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import FadeUp from "@/components/animations/FadeUp";

export const metadata: Metadata = {
  title: "Pricing | CodeFromScratch",
  description: "Choose the plan that fits your learning journey.",
};

const plans = [
  {
    name: "Free",
    description: "Start learning with free articles and community access.",
    price: "$0",
    period: "forever",
    features: [
      "Access to all free articles",
      "Save posts to collections",
      "Newsletter subscription",
      "Community access",
      "Purchase ebooks & courses individually",
    ],
    highlighted: false,
    comingSoon: false,
    cta: "Get Started",
    ctaHref: "/register",
  },
  {
    name: "Pro",
    description: "Unlock every premium article and early access content.",
    price: null,
    period: "/month",
    features: [
      "Everything in Free",
      "Access to all premium articles",
      "Early access to new content",
      "Ad-free reading experience",
      "Priority support",
      "Purchase ebooks & courses individually",
    ],
    highlighted: true,
    comingSoon: true,
    cta: "Coming Soon",
    ctaHref: null,
  },
  {
    name: "Pro+",
    description: "The full experience — premium content, every ebook & course included.",
    price: null,
    period: "/month",
    features: [
      "Everything in Pro",
      "All ebooks included for free",
      "All courses included for free",
      "Exclusive code repos & starter kits",
      "Members-only content drops",
    ],
    highlighted: false,
    comingSoon: true,
    cta: "Coming Soon",
    ctaHref: null,
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time. You will continue to have access until the end of your billing period.",
  },
  {
    q: "Can I buy ebooks and courses without a subscription?",
    a: "Yes! All ebooks and courses are available for individual purchase on the Free and Pro plans. Pro+ members get them all included.",
  },
  {
    q: "What is the difference between Pro and Pro+?",
    a: "Pro unlocks all premium articles. Pro+ includes everything in Pro plus every ebook and course at no extra cost — the best value if you want the full learning experience.",
  },
  {
    q: "Is there a student discount?",
    a: "Yes! We will offer a 50% discount for students with a valid .edu email address when paid plans launch.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
  },
];

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <FadeUp>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
              Pricing
            </p>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Invest in Your{" "}
              <span className="gradient-text">Growth</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
              Start for free. Upgrade when you are ready for premium content,
              ebooks, and an ad-free experience.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto -mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <FadeUp key={plan.name} delay={0.05 * i}>
              <div
                className={`relative flex flex-col rounded-2xl border p-8 transition ${
                  plan.highlighted
                    ? "scale-[1.02] border-accent bg-surface shadow-2xl shadow-accent/10 ring-1 ring-accent md:scale-105"
                    : "border-border bg-surface shadow-lg"
                }`}
              >
                {/* Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent px-4 py-1 text-xs font-bold text-[#0f172a] shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6 flex items-baseline gap-1">
                  {plan.comingSoon ? (
                    <span className="rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent">
                      Coming Soon
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl font-extrabold tracking-tight text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {plan.period}
                      </span>
                    </>
                  )}
                </div>

                {/* Divider */}
                <div className="mb-6 h-px bg-border" />

                {/* Features */}
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

                {/* CTA */}
                {plan.comingSoon ? (
                  <button
                    disabled
                    className="w-full rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground opacity-60 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                ) : plan.ctaHref ? (
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
                ) : null}
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <FadeUp delay={0.2}>
        <section className="mx-auto mt-20 max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-foreground">10+</span>
              <span className="mt-1 text-xs uppercase tracking-wider">Articles</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-foreground">5+</span>
              <span className="mt-1 text-xs uppercase tracking-wider">Categories</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-foreground">100%</span>
              <span className="mt-1 text-xs uppercase tracking-wider">Free to Start</span>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* FAQ */}
      <section className="mx-auto mt-20 max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <FadeUp>
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
        </FadeUp>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <FadeUp key={faq.q} delay={0.05 * i}>
              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="font-semibold text-foreground">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{faq.a}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>
    </div>
  );
}

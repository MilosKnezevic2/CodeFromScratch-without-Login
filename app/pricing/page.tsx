import type { Metadata } from "next";
import Link from "next/link";
import FadeUp from "@/components/animations/FadeUp";
import PricingToggle from "@/components/stripe/PricingToggle";
import JsonLd from "@/components/seo/JsonLd";
import { faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing | CodeFromScratch",
  description: "Choose the plan that fits your learning journey.",
};

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
    a: "Yes! We offer a 50% discount for students with a valid .edu email address. Contact us to claim your discount.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Absolutely. If you're not satisfied within the first 30 days, we'll refund your payment. No questions asked.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
  },
];

export default function PricingPage() {
  return (
    <div>
      <JsonLd data={faqJsonLd(faqs)} />
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

      {/* Pricing Cards with Toggle */}
      <section className="mx-auto -mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
        <PricingToggle />
      </section>

      {/* Trust Badges */}
      <FadeUp delay={0.15}>
        <section className="mx-auto mt-12 max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              30-day money-back guarantee
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Secure checkout via Stripe
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel anytime, no lock-in
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

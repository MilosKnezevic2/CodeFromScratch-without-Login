"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
  postCount: number;
}

interface PostSummary {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  readingTime?: number;
  categories?: { title: string }[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<PostSummary[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  function toggleCategory(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleSaveInterests() {
    setSaving(true);
    try {
      await fetch("/api/user/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selected }),
      });

      // Fetch recommendations based on selected interests
      const res = await fetch(
        `/api/onboarding/recommendations?categories=${selected.join(",")}`
      );
      const data = await res.json();
      setRecommendations(data.posts || []);
      setStep(2);
    } catch {
      // Continue anyway
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  function handleFinish() {
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-[80dvh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-10 bg-accent"
                  : s < step
                    ? "w-6 bg-accent/40"
                    : "w-6 bg-surface-3"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Pick topics */}
        {step === 1 && (
          <div className="animate-fade-up">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-foreground">
                What are you interested in?
              </h1>
              <p className="mt-2 text-muted">
                Pick at least 3 topics to personalize your experience.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {categories.map((cat) => {
                const isSelected = selected.includes(cat.slug.current);
                return (
                  <button
                    key={cat._id}
                    onClick={() => toggleCategory(cat.slug.current)}
                    className={`rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                      isSelected
                        ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_rgba(45,212,191,0.15)]"
                        : "border-border text-muted hover:border-accent/30 hover:text-foreground"
                    }`}
                  >
                    {cat.title}
                    {cat.postCount > 0 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {cat.postCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {categories.length === 0 && (
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Loading topics...
              </div>
            )}

            <div className="mt-10 flex justify-center">
              <button
                onClick={handleSaveInterests}
                disabled={selected.length < 3 || saving}
                className="cta-glow rounded-lg px-8 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : `Continue (${selected.length}/3+)`}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Recommendations */}
        {step === 2 && (
          <div className="animate-fade-up">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-foreground">
                Here are your first reads
              </h1>
              <p className="mt-2 text-muted">
                Based on your interests. Dive in!
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {recommendations.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug.current}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-accent/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-accent transition">
                      {post.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {post.categories?.[0]?.title}{post.readingTime ? ` · ${post.readingTime} min read` : ""}
                    </p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}

              {recommendations.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No recommendations yet — check out the blog!
                </p>
              )}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setStep(3)}
                className="cta-glow rounded-lg px-8 py-3 text-sm font-semibold"
              >
                One more step
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Newsletter */}
        {step === 3 && (
          <div className="animate-fade-up">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-foreground">
                Stay in the loop
              </h1>
              <p className="mt-2 text-muted">
                Get weekly tutorials and tips in your inbox. No spam.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-sm text-muted-foreground">
                We&apos;ll use your account email to send a personalized weekly digest based on your interests.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleFinish}
                  className="cta-glow rounded-lg px-8 py-3 text-sm font-semibold"
                >
                  Go to Dashboard
                </button>
                <Link
                  href="/blog"
                  className="text-sm font-medium text-accent transition hover:text-accent-2"
                >
                  Start reading instead →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

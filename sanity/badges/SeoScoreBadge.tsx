import type { DocumentBadgeComponent, SanityDocument } from "sanity";

type Check = { weight: number; passed: boolean; label: string };

/**
 * Compute a 0-100 SEO score from a post document.
 *
 * Designed to give the editor a single glanceable signal at the top
 * of the document pane — green = ready, yellow = some gaps, red =
 * structural issues. Each check has a weight that sums to 100.
 */
function computeSeoScore(doc: SanityDocument | undefined): {
  score: number;
  checks: Check[];
} {
  const post = (doc ?? {}) as Record<string, unknown>;
  const title = typeof post.title === "string" ? post.title : "";
  const slug =
    post.slug && typeof post.slug === "object" && "current" in post.slug
      ? String((post.slug as { current?: unknown }).current ?? "")
      : "";
  const excerpt = typeof post.excerpt === "string" ? post.excerpt : "";
  const seoTitle = typeof post.seoTitle === "string" ? post.seoTitle : "";
  const seoDescription =
    typeof post.seoDescription === "string" ? post.seoDescription : "";
  const featuredImage = post.featuredImage as
    | { alt?: string; asset?: unknown }
    | undefined;
  const content = Array.isArray(post.content) ? post.content : [];
  const categories = Array.isArray(post.categories) ? post.categories : [];

  const wordCount = countWordsInBlocks(content);

  const checks: Check[] = [
    { weight: 10, passed: title.length >= 10 && title.length <= 70, label: "Title 10-70 chars" },
    { weight: 5, passed: slug.length > 0, label: "Slug set" },
    { weight: 15, passed: excerpt.length >= 60 && excerpt.length <= 280, label: "Excerpt 60-280 chars" },
    { weight: 10, passed: seoTitle.length > 0 && seoTitle.length <= 70, label: "SEO title set" },
    { weight: 15, passed: seoDescription.length >= 120 && seoDescription.length <= 170, label: "SEO description 120-170 chars" },
    { weight: 15, passed: !!featuredImage?.asset, label: "Featured image" },
    { weight: 5, passed: !!featuredImage?.alt, label: "Featured image alt text" },
    { weight: 15, passed: wordCount >= 300, label: "Content ≥ 300 words" },
    { weight: 5, passed: categories.length >= 1 && categories.length <= 3, label: "1-3 categories" },
    { weight: 5, passed: countH2InBlocks(content) >= 2, label: "≥ 2 H2 sections" },
  ];

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
  const score = Math.round((earned / totalWeight) * 100);
  return { score, checks };
}

function countWordsInBlocks(blocks: unknown[]): number {
  let n = 0;
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const b = block as { _type?: string; children?: { text?: string }[] };
    if (b._type === "block" && Array.isArray(b.children)) {
      for (const child of b.children) {
        if (typeof child?.text === "string") {
          n += child.text.trim().split(/\s+/).filter(Boolean).length;
        }
      }
    }
  }
  return n;
}

function countH2InBlocks(blocks: unknown[]): number {
  let n = 0;
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const b = block as { _type?: string; style?: string };
    if (b._type === "block" && b.style === "h2") n += 1;
  }
  return n;
}

const SeoScoreBadge: DocumentBadgeComponent = (props) => {
  if (props.type !== "post") return null;
  const doc = (props.published ?? props.draft) as SanityDocument | undefined;
  const { score, checks } = computeSeoScore(doc);
  const failing = checks.filter((c) => !c.passed);
  const tone: "success" | "warning" | "danger" =
    score >= 85 ? "success" : score >= 60 ? "warning" : "danger";
  const title =
    failing.length === 0
      ? "All SEO checks pass."
      : `Missing: ${failing.map((c) => c.label).join(", ")}`;
  return {
    label: `SEO ${score}`,
    title,
    color: tone,
  };
};

export default SeoScoreBadge;

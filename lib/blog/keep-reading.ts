/**
 * Picks the articles shown after an article ("Keep reading") and the one
 * "Up next" card beside it. Deterministic, so a prerendered page keeps the
 * same picks between refreshes, and each pick carries the reason it is
 * there, in words the reader sees.
 */
export interface ReadingCandidate {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  readingTime?: number;
  publishedAt?: string;
  featuredImage?: { asset: { _ref: string }; alt?: string };
  categories?: { title: string; slug: { current: string } }[];
  tags?: { slug: { current: string } }[] | null;
}

export interface ReadingPick extends ReadingCandidate {
  reason: string;
}

export interface CurrentArticle {
  _id: string;
  categories?: { title: string; slug: { current: string } }[];
  tags?: { slug: { current: string } }[] | null;
}

const newestFirst = (a: ReadingCandidate, b: ReadingCandidate) =>
  (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");

export function pickKeepReading(current: CurrentArticle, candidates: ReadingCandidate[], count = 3): ReadingPick[] {
  const category = current.categories?.[0];
  const currentTags = new Set((current.tags ?? []).map((t) => t.slug.current));
  const categoryTitle = category?.title ?? "the journal";

  const scored = candidates
    .filter((c) => c._id !== current._id)
    .map((c) => ({
      post: c,
      shared: (c.tags ?? []).filter((t) => currentTags.has(t.slug.current)).length,
      sameCategory: !!category && (c.categories ?? []).some((cat) => cat.slug.current === category.slug.current),
    }));

  const byRelevance = (a: (typeof scored)[number], b: (typeof scored)[number]) =>
    b.shared - a.shared || newestFirst(a.post, b.post);

  // Three shelves, in the order a reader would want them: the same topic
  // (shared tags) in the same category, the rest of the category, then one
  // from elsewhere so the list is not a corridor.
  const sameTopic = scored.filter((s) => s.sameCategory && s.shared > 0).sort(byRelevance);
  const sameCategory = scored.filter((s) => s.sameCategory && s.shared === 0).sort(byRelevance);
  const elsewhere = scored.filter((s) => !s.sameCategory).sort(byRelevance);

  const picks: ReadingPick[] = [];
  const used = new Set<string>();
  const take = (shelf: typeof scored, reason: (p: ReadingCandidate) => string, max: number) => {
    for (const s of shelf) {
      if (picks.length >= count || max <= 0) return;
      if (used.has(s.post._id)) continue;
      used.add(s.post._id);
      picks.push({ ...s.post, reason: reason(s.post) });
      max -= 1;
    }
  };

  const nearby = Math.min(count - 1, count);
  take(sameTopic, () => "Same topic", nearby);
  take(sameCategory, () => `More in ${categoryTitle}`, nearby - picks.length);
  take(elsewhere, (p) => `From ${p.categories?.[0]?.title ?? "the journal"}`, 1);
  // Not enough in the neighbourhood: fill from whatever is left, in the same order.
  take(sameTopic, () => "Same topic", count);
  take(sameCategory, () => `More in ${categoryTitle}`, count);
  take(elsewhere, (p) => `From ${p.categories?.[0]?.title ?? "the journal"}`, count);
  return picks;
}

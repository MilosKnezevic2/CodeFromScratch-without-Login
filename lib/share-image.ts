/**
 * Address of the share card that /api/og draws for a page: the title, the
 * category that picks the accent (a title or a slug, see the route), and an
 * optional kicker for the small label above the title ("Category · 7
 * articles"). Articles leave the kicker to the category name.
 *
 * Encoded with encodeURIComponent, so the addresses already cached for
 * articles do not change.
 */
export function shareImageUrl(title: string, category?: string, kicker?: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";
  let url = `${base}/api/og?title=${encodeURIComponent(title)}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (kicker) url += `&kicker=${encodeURIComponent(kicker)}`;
  return url;
}

export function articleCount(n: number): string {
  return `${n} ${n === 1 ? "article" : "articles"}`;
}

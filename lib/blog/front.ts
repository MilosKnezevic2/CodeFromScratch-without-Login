/**
 * The journal's front page (/blog), laid out like a magazine: one lead
 * story, two beside it, then a section per area of the stack, then the most
 * read. Areas group the Sanity categories; they are a reading aid on this
 * site only, so they live in code, not in the CMS. Free of I/O so it can be
 * tested.
 */

export interface Area {
  slug: string;
  name: string;
  /** One line under the section heading: why the group exists. */
  why: string;
  /** Search title of the area page; falls back to "<name> tutorials". */
  searchTitle?: string;
  categories: string[];
}

export const AREAS: Area[] = [
  {
    slug: "frontend",
    name: "Frontend",
    why: "HTML, CSS, layouts and React",
    searchTitle: "Frontend Tutorials: HTML, CSS and React",
    categories: ["web-fundamentals", "javascript-frameworks", "css-ecosystem", "testing", "design-and-ui-ux"],
  },
  {
    slug: "backend-and-data",
    name: "Backend & data",
    why: "Databases, auth, APIs and payments",
    categories: [
      "databases",
      "apis-and-integrations",
      "architecture-and-patterns",
      "backend-as-a-service",
      "backend-technologies",
      "web-development",
      "ai-and-machine-learning",
    ],
  },
  {
    slug: "production",
    name: "Production",
    why: "Deploys, logging, security and rollbacks",
    searchTitle: "Production Tutorials: Deploys, Logging, Security",
    categories: ["cloud-and-hosting", "devops-and-infrastructure", "security", "performance", "build-tools-and-tooling"],
  },
  {
    slug: "career",
    name: "Career",
    why: "Learning, workflows and the job",
    categories: ["developer-experience-and-career"],
  },
];

export function areaOfCategory(categorySlug: string | undefined): Area | undefined {
  return categorySlug ? AREAS.find((a) => a.categories.includes(categorySlug)) : undefined;
}

export function areaBySlug(slug: string): Area | undefined {
  return AREAS.find((a) => a.slug === slug);
}

export interface FrontPost {
  slug: string;
  title: string;
  publishedAt?: string;
  category?: { title: string; slug: string };
}

export interface FrontSection<P> {
  area: Area;
  items: P[];
  /** Every article in the area, for "View all N". */
  total: number;
}

export interface FrontLayout<P> {
  lead: P | null;
  second: P[];
  sections: FrontSection<P>[];
  popular: P[];
}

/** Articles per area section on the front page. */
export const SECTION_SIZE = 3;
export const POPULAR_SIZE = 5;

/**
 * `posts` newest first. The lead and the two after it are the newest three;
 * each area section shows its newest articles not already above, and only
 * areas with enough left to fill a row get a section. "Most read" follows the
 * view counts; while there are too few, it is topped up with the newest
 * articles not yet on the page, so it is never empty or thin.
 */
export function buildFront<P extends FrontPost>(posts: P[], mostReadSlugs: string[]): FrontLayout<P> {
  const [lead = null, ...rest] = posts;
  const second = rest.slice(0, 2);
  const shown = new Set([lead, ...second].filter((p): p is P => p !== null).map((p) => p.slug));

  const sections: FrontSection<P>[] = [];
  for (const area of AREAS) {
    const inArea = posts.filter((p) => areaOfCategory(p.category?.slug) === area);
    const items = inArea.filter((p) => !shown.has(p.slug)).slice(0, SECTION_SIZE);
    if (items.length < SECTION_SIZE) continue;
    items.forEach((p) => shown.add(p.slug));
    sections.push({ area, items, total: inArea.length });
  }

  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const popular = mostReadSlugs.flatMap((s) => bySlug.get(s) ?? []).slice(0, POPULAR_SIZE);
  for (const p of posts) {
    if (popular.length >= POPULAR_SIZE) break;
    if (!popular.includes(p) && !shown.has(p.slug)) popular.push(p);
  }
  return { lead, second, sections, popular };
}

/** Article counts per area, for the area tabs. */
export function areaCounts(posts: FrontPost[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of posts) {
    const area = areaOfCategory(p.category?.slug);
    if (area) counts.set(area.slug, (counts.get(area.slug) ?? 0) + 1);
  }
  return counts;
}

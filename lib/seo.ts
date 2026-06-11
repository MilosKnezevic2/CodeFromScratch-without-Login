import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";

export function generateMetadata({
  title,
  description,
  path = "",
  image,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const url = `${siteUrl}${path}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "CodeFromScratch",
      type: "website",
      ...(image && { images: [{ url: image, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
    alternates: { canonical: url },
  };
}

export function articleJsonLd({
  title,
  description,
  url,
  publishedAt,
  author,
  image,
}: {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  author: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished: publishedAt,
    author:
      author === "Milos Knezevic"
        ? personJsonLd()
        : { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: "CodeFromScratch",
      url: siteUrl,
    },
    ...(image && { image }),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CodeFromScratch",
    url: siteUrl,
    logo: `${siteUrl}/brand/favicon-512.png`,
    description:
      "A journal for serious web developers — tutorials, guides, and deep dives on modern web development with production-grade code.",
    founder: personJsonLd(),
  };
}

// E-E-A-T: the whole brand is one named author, so tell Google who he is.
// Extend sameAs as public profiles go live — each verified profile
// strengthens the author entity.
export function personJsonLd() {
  return {
    "@type": "Person",
    name: "Milos Knezevic",
    url: siteUrl,
    jobTitle: "Full-stack web developer",
    knowsAbout: [
      "Web development",
      "Next.js",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Full-stack architecture",
    ],
    sameAs: ["https://github.com/MilosKnezevic2"],
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

export function itemListJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

/**
 * Schema.org Blog (CollectionPage) marker for the /blog index. Helps
 * Google identify the page as a blog hub rather than a generic listing
 * and enables rich-card listings on SERPs. Pair with itemListJsonLd to
 * surface the actual posts.
 */
export function blogCollectionJsonLd({
  url,
  name,
  description,
}: {
  url: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": url,
    url,
    name,
    description,
    publisher: {
      "@type": "Organization",
      name: "CodeFromScratch",
      url: siteUrl,
    },
  };
}

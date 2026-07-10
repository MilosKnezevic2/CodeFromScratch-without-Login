import { personJsonLd } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";

interface ArticleJsonLdProps {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  updatedAt?: string;
  authorName?: string;
  imageUrl?: string;
}

export default function ArticleJsonLd({
  title,
  slug,
  excerpt,
  publishedAt,
  updatedAt,
  authorName,
  imageUrl,
}: ArticleJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    ...(excerpt && { description: excerpt }),
    ...(authorName && {
      // E-E-A-T: the site's own author gets the full Person entity
      // (jobTitle, knowsAbout, sameAs profiles), not just a bare name.
      author:
        authorName === "Milos Knezevic"
          ? personJsonLd()
          : { "@type": "Person", name: authorName },
    }),
    ...(imageUrl && { image: imageUrl }),
    publisher: {
      "@type": "Organization",
      name: "CodeFromScratch",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/favicon-512.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

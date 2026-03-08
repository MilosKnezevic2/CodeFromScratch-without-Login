const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface ArticleJsonLdProps {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  authorName?: string;
  imageUrl?: string;
}

export default function ArticleJsonLd({
  title,
  slug,
  excerpt,
  publishedAt,
  authorName,
  imageUrl,
}: ArticleJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: publishedAt,
    ...(excerpt && { description: excerpt }),
    ...(authorName && {
      author: { "@type": "Person", name: authorName },
    }),
    ...(imageUrl && { image: imageUrl }),
    publisher: {
      "@type": "Organization",
      name: "CodeFromScratch",
      url: SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

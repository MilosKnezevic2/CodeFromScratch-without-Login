import Link from "next/link";

interface BreadcrumbsProps {
  category?: { title: string; slug: { current: string } };
  postTitle: string;
}

export default function Breadcrumbs({ category, postTitle }: BreadcrumbsProps) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/" className="shrink-0 transition hover:text-accent">Home</Link>
      <span>/</span>
      <Link href="/blog" className="shrink-0 transition hover:text-accent">Blog</Link>
      {category && (
        <>
          <span>/</span>
          <Link
            href={`/blog/category/${category.slug.current}`}
            className="shrink-0 transition hover:text-accent"
          >
            {category.title}
          </Link>
        </>
      )}
      <span>/</span>
      <span className="text-muted">{postTitle}</span>
    </nav>
  );
}

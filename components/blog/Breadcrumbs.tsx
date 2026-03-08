import Link from "next/link";

interface BreadcrumbsProps {
  category?: { title: string; slug: { current: string } };
  postTitle: string;
}

export default function Breadcrumbs({ category, postTitle }: BreadcrumbsProps) {
  return (
    <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/" className="transition hover:text-accent">Home</Link>
      <span>/</span>
      <Link href="/blog" className="transition hover:text-accent">Blog</Link>
      {category && (
        <>
          <span>/</span>
          <Link
            href={`/blog/category/${category.slug.current}`}
            className="transition hover:text-accent"
          >
            {category.title}
          </Link>
        </>
      )}
      <span>/</span>
      <span className="truncate max-w-[200px] text-muted">{postTitle}</span>
    </nav>
  );
}

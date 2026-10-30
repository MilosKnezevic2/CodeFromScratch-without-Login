Route group for the listing pages (index, search). It exists only so the
skeleton in loading.tsx wraps these pages and NOT app/blog/[slug],
app/blog/page/[n], app/blog/category/[slug] or app/blog/tag/[slug]: those
call notFound() for unknown values, and a loading.tsx above them would stream
a 200 shell before the 404 could be sent.

/blog is static (no query string). /blog/page/N is static too. Every filtered
view (?q, ?category, ?tag, ?sort and their pages) renders per request on
/blog/search and is noindex. lib/blog-url.ts owns the addresses; the proxy
redirects the old /blog?... forms.

A loading.tsx above a dynamic route lets Next stream the shell before the
post lookup finishes, so an unknown slug answers HTTP 200 (soft 404) instead
of 404. Keep loading.tsx out of any segment that contains [slug].

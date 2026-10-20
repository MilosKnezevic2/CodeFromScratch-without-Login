Route group for the listing pages (index, category, tag). It exists only so
the skeleton in loading.tsx wraps these pages and NOT app/blog/[slug].

A loading.tsx above a dynamic route lets Next stream the shell before the
post lookup finishes, so an unknown slug answers HTTP 200 (soft 404) instead
of 404. Keep loading.tsx out of any segment that contains [slug].

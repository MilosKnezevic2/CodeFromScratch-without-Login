# Thumbnails (cover images) — how to make them

Every article needs a cover (the `featuredImage` in Sanity). You have two
ways to get one. 90% of the time, use Way 1.

---

## Way 1 — Auto-generated branded cover (recommended, zero design work)

The site generates a branded cover for any title + category automatically.
You don't draw anything — you just point Sanity at the generated image.

The generator URL (open it in your browser to preview):

```
https://codefromscratch.org/api/og?title=YOUR%20TITLE&category=YOUR%20CATEGORY
```

- Replace spaces with `%20` (or just type the title in the address bar and
  the browser handles it).
- The layout is picked automatically from the title (4 designs rotate, so
  no two articles look identical), and the colour comes from the category.
- It always renders the brand font (Fraunces) at 1200×630 — the correct
  size for both the site and social-media link previews.

### Attaching it to a post (two options)

**Option A — let the script do it (easiest for a batch).** When you create
posts with the project scripts they already fetch and attach a cover. For a
one-off, run from the `blog-cms` folder:

```bash
node scripts/set-cover.mjs <post-slug>
```

(That helper script fetches the generated cover for the post's current
title + category and uploads it as the featured image.)

**Option B — by hand in Sanity Studio.**
1. Open the generator URL above in your browser, right-click the image →
   *Save image as…* → save the PNG.
2. In Studio, open the post → **Featured image** → upload that PNG.
3. Fill the **alt** text (use the article title).

> Tip: the social-media preview (the image people see when your link is
> shared on X/LinkedIn) is generated live from this same endpoint, so even
> if you skip the featured image the link preview still looks right. The
> featured image is what shows on the blog grid itself.

---

## Way 2 — Your own custom image (for a special article)

When an article deserves a bespoke cover (a screenshot, a diagram, a photo):

- Export it at **1200×630 px** (exactly — this is the ratio every cover
  surface on the site expects; anything else gets letter-boxed).
- Keep important content **away from the extreme left/right edges** (~70px
  margin) so nothing critical sits on the crop line.
- In Studio: post → **Featured image** → upload → set **alt** text.
- Optimise it first (squoosh.app, target < 200 KB) — covers are above the
  fold and count toward page speed.

Free sources if you want imagery: Unsplash, Pexels (photos); unDraw,
Storyset (illustrations). Avoid generic stock-photo "laptop on desk" shots
— they read as cheap. A branded cover (Way 1) almost always looks better
for a code article.

---

## Changing the cover designs themselves

The 4 layouts, colours, and fonts live in `app/api/og/route.tsx`. Edit
there, push to `main`, and every cover regenerated afterwards uses the new
design. To re-cover all existing posts at once after a design change, run
`node scripts/recover-all.mjs` (re-fetches and re-attaches covers for every
post). Preview a single layout while editing with `?v=a` … `?v=e` on the
generator URL.

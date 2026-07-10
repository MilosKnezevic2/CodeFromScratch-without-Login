# Changelog

All notable changes to this project are recorded here.
Format: Added / Changed / Fixed / Removed per version.
Project versioning: semver (applied once first production release ships).

## [Unreleased]

### Fixed (2026-07 quality round: fonts, a11y, CI)
- The wordmark in Navbar/Footer silently rendered in Georgia — its
  'Fraunces Variable' face was referenced but never imported. Fraunces
  now ships; three font families that could never render (Plus Jakarta
  Sans, Inter, JetBrains Mono sat below Sen/Geist in every stack) were
  removed from imports, CSS stacks, and package.json (with Space
  Grotesk, also unused).
- WCAG AA (axe, both themes, 8 public pages → 0 violations):
  `text-accent-foreground` was an undefined token, so accent-filled CTA
  buttons inherited white on light teal (1.86:1); it is now defined per
  theme (7.77:1 dark). The light theme accent moves #0d9488 → #0f766e
  (teal-700) so accent link text passes on the page background (3.32:1 →
  4.86:1) and white button ink measures 5.47:1. In-text links on legal
  pages gained permanent underlines (color was their only distinction).
- RSS channel `<image>` now points at a PNG (spec-compliant; SVG is
  ignored by readers), and five unused create-next-app template SVGs
  were deleted from `public/`.

### Changed (2026-07 quality round: fonts, a11y, CI)
- CI build step is now blocking: since the resilience work the build
  needs no reachable Sanity, database, or Resend key, so a red build is
  a real regression (was advisory with a placeholder project id).
- Contact API gained a regression suite (validation, honeypot, rate
  limit, DB-down, email-failure degradation, entity-escaping fix).

### Security (2026-07 site audit remediation)
- `/api/revalidate` now requires the `SANITY_REVALIDATE_SECRET` shared
  secret (constant-time compare; fails closed when unset). Previously any
  unauthenticated POST could purge the blog cache in a loop.
- Newsletter confirm/unsubscribe no longer mutate on GET: email links land
  on an interstitial page and the change happens on a button-press POST —
  mail scanners that prefetch links (Outlook SafeLinks, Gmail) can no
  longer silently confirm or unsubscribe readers. Legacy GET links 307 to
  the new page. Campaign emails now also carry RFC 8058 one-click
  unsubscribe headers.
- Subscribe endpoint returns one neutral message for every valid address
  (no more "Already subscribed" probe) and got a honeypot field, mirroring
  the contact form.
- CSRF origin check hardened: parsed-URL comparison against the
  deployment's own origin plus `NEXT_PUBLIC_SITE_URL` (was a fragile string
  equality that failed open with the env var unset and 403'd previews).
- Dependency audit: 0 high vulnerabilities (was 2 high; lockfile-only
  bumps, no breaking upgrades).

### Fixed (2026-07 site audit remediation)
- **Unsubscribe links in campaigns never worked**: the DB stores a hashed
  token, campaigns linked that stored hash, and the endpoint hashed it
  again before lookup — guaranteed mismatch. Lookup is now a direct
  compare, so links in already-sent campaigns work too.
- Confirmation links are idempotent (re-click says "already confirmed",
  not "invalid link") and expire after 7 days, with re-subscribe issuing a
  fresh token.
- Confirm/unsubscribe endpoints handle a paused/unreachable Postgres with
  a clean status instead of an unhandled 500 — the exact free-tier
  auto-pause scenario.
- Production build no longer requires `RESEND_API_KEY` (lazy client) and
  no longer fails when Sanity is unreachable during `generateStaticParams`
  (degrades to on-demand rendering).
- Contact notifications no longer show HTML entities (`&amp;#039;`) — the
  escaping belonged to an HTML sink, but storage renders through React and
  the email is plain text.
- `/api/og` caches fonts per instance and falls back to the static brand
  cover when the font CDN is unreachable (was an unconditional 500 → links
  shared with no image).
- RSS/Atom/JSON feeds return 503 + Retry-After when Sanity is down so
  readers keep cached items (was 500).
- CSP allowlists plausible.io, so enabling the optional analytics won't be
  silently blocked.

### Added (2026-07 site audit remediation)
- SEO: canonical URLs on every public route (articles most importantly —
  they were missing one entirely), per-route metadata for `/contact`,
  real titles + canonicals + `notFound()` on category/tag pages (were
  brand-doubled soft-404s), one canonical URL scheme for category/tag
  listings, `noindex` on search/sort facets and newsletter utility pages,
  `dateModified` + full Person entity (E-E-A-T) in Article JSON-LD,
  sitemap now includes legal pages, categories, and tags; robots.txt
  carves `/api/og` out of the `/api/*` block.
- `app/error.tsx`: branded error boundary with retry (was Next's unstyled
  default on any Sanity/Postgres hiccup).
- Postgres pool timeouts (3s connect / 5s query) so opportunistic stats
  reads on home/blog fail fast into their zero-fallbacks instead of
  hanging the render.
- Regression tests for the revalidate secret, rate limiter, CSRF origin
  logic, and the newsletter confirm/unsubscribe/subscribe flows.

### Changed (2026-07 site audit remediation)
- `middleware.ts` → `proxy.ts` (Next 16 deprecated the middleware file
  convention).
- Rate limiter drops its `setInterval` (serverless antipattern) for lazy
  sweeping; per-instance semantics documented.

### Security
- **CRITICAL** Remediated admin-session bypass in `/portal-cfs-admin/**`.
  The previous session cookie was a static literal string
  (`cfs-admin-token=authenticated`), accepted by middleware on equality,
  allowing anyone who knew the cookie name to access the admin portal
  (users, revenue, newsletter send, Sanity Studio). Replaced with an
  HMAC-SHA256-signed token (Web Crypto, Edge-runtime compatible) using
  `NEXTAUTH_SECRET`, with payload validation, expiry enforcement
  (24h default), and constant-time signature comparison.
  Recorded in the Firm B governance tree at
  `ai-holding-os/firms/firm-b-enterprise/projects/backlog/blog-cms/decisions/2026-04-24-exception-a2-security-hotfix.md`.

### Added
- Vitest test harness and initial unit test suite for `lib/admin-session`
  (8 tests covering signature, tampering, expiry, secret rotation,
  and legacy-bypass rejection).
- `.npmrc` with `legacy-peer-deps=true` to stabilise installs against
  the pre-existing React 19 peer-dep surface (already in effect via
  lockfile; now explicit).
- CI steps: `npm audit --audit-level=high` (advisory, non-blocking
  during remediation) and `npm test`.

### Changed
- `middleware.ts`: admin cookie verification now runs through
  `verifyAdminSession()` (async) instead of the literal-string check.
- `app/api/admin-auth/login/route.ts`: awaits the now-async
  `createAdminSession()`.

### Known — not addressed in this change
- 50 pre-existing dependency vulnerabilities (32 moderate, 18 high)
  surfaced by `npm audit`; advisory only under this change.
- Pre-existing lint issues on `main` in unrelated files
  (`lib/shiki.ts`, `components/blog/MobileTocDrawer.tsx`, etc.).
  Not introduced by this change; scheduled for the refactor cycle
  under Firm B exception A3.

# Changelog

All notable changes to this project are recorded here.
Format: Added / Changed / Fixed / Removed per version.
Project versioning: semver (applied once first production release ships).

## [Unreleased]

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

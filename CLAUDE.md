# CLAUDE.md — blog-cms (CodeFromScratch)

Project instructions for AI assistants working in this repository.
This file is the **single source of active rules** for the project.
Material decisions are recorded in `DECISIONS.md`. The former governance
repository (`../ai-holding-os/`) is an **archive** — its documents
(mission, legal/security baselines, deploy playbook, content plan) remain
citable reference, but its process machinery (exceptions, L-levels,
lifecycle logs, agents) is retired. Do not produce governance artifacts.

## 1. What this project is

**CodeFromScratch** — a production-grade web/software-development learning
platform, built and operated by one person (Milos, the operator). The
operator is not a developer; explain technical choices simply, decide
confidently, and never ask "do you want me to…" for reversible work.
When the operator writes in Serbian, respond in Serbian (Latin script).

**Mission (2026-04-24, revised):** the trusted full-stack learning
platform for developers who want to ship real software — single voice,
production-grade code, end-to-end journeys across the modern web stack.

**Current posture (since 2026-05-14): content-first launch.**
- Public site = journal only: `/`, `/blog`, `/blog/[slug]`, `/newsletter`,
  `/contact`, legal pages. SaaS surfaces (auth, dashboard, ebooks, courses,
  pricing, premium gating, comments, reactions) exist in code but are
  hidden from navigation, sitemap, and robots until the commerce backend
  is finished and relaunched deliberately.
- The public surface must **never depend on Postgres** at build or render
  time (the free-tier database auto-pauses). Content comes from Sanity.
  Admin + dashboard render per request (`force-dynamic` in their layouts).

## 2. Repositories and branches

- **Primary remote: `without-login`** (github.com/MilosKnezevic2/CodeFromScratch-without-Login)
  - `main` — public content-first site. Production intent.
  - `dev` — same code with all SaaS surfaces re-enabled, for backend work.
- **Archive remote: `origin`** (CodeFromScratch-Claude) — frozen at the
  April-2026 state (PRs #1–#24). Do not push new work there.
- ~70 unmerged April-era branches hold a stacked admin/newsletter/inbox/
  studio rebuild (+54 commits, 12 new Prisma models). **Parked** until
  post-launch; merge newsletter family first. See `DECISIONS.md`.
- Branch naming: `feat/*`, `fix/*`, `update/*`. Conventional commits;
  the message explains *why*. Never `--no-verify`; if a hook fails, fix
  the cause.

## 3. Stack

- Next.js 16 (App Router) + React 19 + React Compiler (`reactCompiler: true`)
- TypeScript strict
- Prisma 7 + PostgreSQL (Supabase free tier — auto-pauses after 7 days idle)
- Sanity v5 (Studio at `/portal-cfs-admin/studio`, AI Assist + Visual Editing)
- NextAuth v5 beta — Google, GitHub, credentials (bcryptjs) + TOTP MFA
- Stripe v20 (wired, hidden from public until relaunch)
- Resend v6 + React Email templates + sequence engine
- Tailwind v4 + CSS variable tokens + framer-motion + next-themes
- Vitest 3 (co-located `*.test.ts`) · husky + lint-staged pre-commit

## 4. Quality bar (non-negotiable, applies to all code)

- **No `any`, no `@ts-ignore`, no TODO/FIXME in shipping code, no
  commented-out code, no silent catches.** A deliberate fallback `.catch()`
  must encode a real degradation decision (e.g. empty catalogue when the
  DB is down), not swallow errors.
- **Validation at trust boundaries** (Zod or equivalent). Types alone are
  not enough for external input.
- **Lighthouse target: 100 on all four axes** on public routes (95 floor).
  Initial JS < 100 KB gzipped per route. WCAG 2.1 AA minimum.
  `prefers-reduced-motion` honoured everywhere.
- **Security:** server-side authorization on every protected endpoint
  independent of UI; sessions `httpOnly`/`Secure`/`SameSite`; bcrypt
  cost ≥ 12 (Argon2id is the direction for new hashes); no raw SQL string
  concatenation — Prisma parameterised queries only; rate limiting on
  public endpoints; no secrets in code or git, ever.
- **Tests ship with critical-path changes** (auth, payments, authz,
  personal data). Every bug fix carries a regression test. Flaky tests
  are fixed, not retried.
- All changes pass `npm run lint`, `npx tsc --noEmit`, `npm test`.

## 5. Known friction (verified 2026-06-09)

- **React 19 peer-dep surface:** `.npmrc` sets `legacy-peer-deps=true`.
  Use `npm ci` for clean installs.
- **`styled-components` is a required peer dependency** of
  `@sanity/visual-editing` — it is intentionally in `package.json`.
  Do not remove it again (PR #8 removed it; the build broke in PR #11).
- **The edge request hook lives in `proxy.ts`** (Next 16 renamed the
  `middleware` convention to `proxy`) and runs on Edge — use Web Crypto
  (`crypto.subtle`), not `node:crypto`, for anything it can reach.
  `lib/admin-session.ts` is the reference implementation (HMAC-SHA256
  signed admin sessions).
- **Database may be asleep.** Never let a public page, the sitemap, or
  the build fail because Postgres is unreachable. Admin/dashboard are
  `force-dynamic`; public ebook routes degrade gracefully.
- `lib/generated/prisma/` is gitignored and regenerated on install
  (`postinstall: prisma generate`).

## 6. Deferred decisions (operator only)

- SaaS relaunch timing (auth/premium/commerce re-enable) — after content
  traction. Relaunch requires: tests on payment paths, CAPTCHA + passkeys
  (mission R3), FAGG §8 checkout wording + Widerrufsbelehrung, and an
  Austrian lawyer consultation (see archived legal baseline).
- NextAuth v5 beta → stable migration when it ships.
- Production domain confirmation at deploy time.

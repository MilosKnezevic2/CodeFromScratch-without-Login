# CLAUDE.md — blog-cms

Project-specific instructions for AI assistants working in this repository.

## 1. Identity and governance

This project is **blog-cms** (brand: CodeFromScratch). It is governed under the Firm B enterprise constitution maintained at `../ai-holding-os/firms/firm-b-enterprise/` (if present on disk) or at the operator's companion governance repository.

- **Project class:** C (payments + auth + personal data + consumer-law surface).
- **Mission anchor:** `firms/firm-b-enterprise/projects/active/blog-cms/decisions/2026-04-24-operator-mission-statement.md` + `decisions/2026-04-24-mission-amendment-global-en-solo.md`.
- **Active roadmap:** `firms/firm-b-enterprise/projects/active/blog-cms/docs/master-roadmap.md`.
- **Active exceptions at time of writing:** A1 (Phase 1-5 retroactive documentation), A2 (admin-auth hotfix — expires on PR #1 merge), A3 (refactor cycle — expires 2026-05-24 or at Phase 5 ratification).

Before making any non-trivial change, an AI assistant must:

1. Read the active exception records in `decisions/` to confirm the change falls within an authorised scope.
2. Read the master roadmap for current phase context.
3. Respect the operator's global `~/.claude/CLAUDE.md` (performance, accessibility, security, SEO targets) *unless* the Firm B constitution sets a stricter bar — in which case the Firm B bar wins.

If the change is not within any active exception, **stop and ask the operator for explicit L3 authorisation** per `approval-policy.md §8`.

## 2. Stack

- Next.js 16 (App Router) + React 19 + React Compiler (`reactCompiler: true` in `next.config.ts`)
- TypeScript strict
- Prisma 7 + PostgreSQL
- Sanity v5 (Studio at `/portal-cfs-admin/studio`)
- NextAuth v5 beta — Google, GitHub, credentials (bcryptjs)
- Stripe v20 — subscriptions + one-offs + webhooks + customer portal
- Resend v6 + six React Email templates + `EmailSequenceStatus` sequence engine
- Tailwind v4 + CSS variable tokens + framer-motion + next-themes
- Vitest 3 (test harness) + Playwright (planned)

## 3. Firm B constitution highlights that affect code here

Rules that differ from — or tighten — the operator's global playbook:

- **No TODO / FIXME / XXX in shipping code** (`coding-constitution.md §2`). Unfinished decisions are tickets, not comments.
- **No `any`, `@ts-ignore`, silent catches, commented-out code.** Hard prohibitions.
- **`strict: true` in `tsconfig.json`** — with `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `exactOptionalPropertyTypes` where deps tolerate.
- **Validation at trust boundaries** via Zod (or equivalent). Types alone are not enough for external input.
- **Lighthouse target: 100 on all four axes** (operator R2 mission tightens the constitution's 95-minimum to strict 100 on all public routes).
- **Initial JS bundle < 100 KB gzipped** per route.
- **WCAG 2.1 AA minimum** on every public surface.
- **`prefers-reduced-motion` honoured everywhere**.
- **Passwords: bcrypt (cost ≥ 12) or Argon2id** — Argon2id is the direction of travel for new hashes per R3.
- **Admin MFA is mandatory**. Paying users MFA mandatory. R3 elevates this.
- **Session cookies:** `httpOnly`, `Secure`, `SameSite=Lax`, regenerated on privilege change.
- **Every protected endpoint checks authorisation server-side**, independent of any UI gate.
- **No raw SQL string concatenation. Ever.** Prisma's parameterised queries only; raw where necessary uses `Prisma.sql`.

## 4. What you can write without per-file approval

Under the active exceptions as of 2026-04-24:

- **A2** (until PR #1 merges): `lib/admin-session.ts`, `middleware.ts`, `app/portal-cfs-admin/login/**`, `.github/workflows/ci.yml` — *only* for the admin-auth bypass remediation plus `npm audit` gate.
- **A3** (until 2026-05-24 or Phase 5 ratification): the ten categories listed in `decisions/2026-04-24-exception-a3-refactor-cycle.md §Scope`. Each category's PR must be scoped to its bullet. PRs open; merge remains operator action.

Anything outside those scopes needs a new named exception or a ratified Phase 5 plan.

## 5. Branch and PR discipline

- `main` = production. No direct pushes.
- Feature branches: `fix/*`, `feat/*`, `update/*` (per operator global playbook).
- Commits: conventional format, `type: description`. Message explains *why*.
- Co-author attribution when AI-written: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- PR title format: `type: description (Firm B L3 exception <A-id>)` when the change lands under an exception.
- PR description: what, why, scope, risk, verification steps. Link to the governance record for the exception.
- **Never** use `--no-verify` or skip CI. If a hook or check fails, investigate and fix the underlying cause.

## 6. Secrets policy

- No secret is ever committed. `.env`, `.env.local`, `.env.*.local` are in `.gitignore` and must stay there.
- `.env.example` lists every required variable with a placeholder and a one-line description.
- If a secret is ever committed historically, it is rotated immediately — see the Phase 3 security-baseline plan for the scheduled `.env` git history audit.

## 7. Testing posture

- Vitest + Testing Library for unit and integration tests. Co-located (`foo.test.ts` next to `foo.ts`).
- Playwright for six critical E2E flows (to land in the A3 test-scaffolding PR).
- Every bug fix ships with a regression test (`coding-constitution.md §9.2`).
- Flaky tests are fixed, not retried. No `.skip` without a ticket and a date.
- CI runs tests on every PR; red blocks merge.

## 8. Known friction

- **React 19 peer-dep surface** across the ecosystem causes `npm install` to fail without `--legacy-peer-deps`. Project has `.npmrc` (on `fix/admin-auth-bypass` branch, not yet merged to `main`) that sets `legacy-peer-deps=true` to stabilise installs. Until PR #1 merges, use `npm ci` instead of `npm install` on `main`.
- **`lib/generated/prisma/` is currently committed** (pre-A1 legacy). It is scheduled for removal from git and deterministic CI generation in an A3 PR.
- **Middleware runs on Edge runtime** — `node:crypto` support is unreliable across Next versions. Prefer Web Crypto (`crypto.subtle.sign`, `crypto.subtle.importKey`) for new code that must run in middleware. The admin-session module in PR #1 is the reference implementation.
- **`styled-components` is listed in `package.json`** but usage is unverified. Audit scheduled in A3 bundle category.

## 9. Deferred decisions (operator L3 only)

These cannot be decided autonomously and are flagged for Phase 5 architecture session with the operator:

- CMS editorial UX path for R4 ("as good as Microsoft Word") — four candidates in `docs/master-roadmap.md §4.4 G4`.
- Production deploy target (Vercel recommended; alternatives evaluated in Phase 5).
- Migration of NextAuth v5 beta → stable when it ships.
- Production domain (currently `codefromscratch.org` assumed but unverified).
- Design direction at G3 — keep / refine / redesign.

## 10. Where to ask questions

- For anything that crosses a constitution line → ask the operator with the specific constitution section named.
- For anything that requires new scope beyond the active exceptions → ask the operator for an explicit L3 grant.
- For anything routine within exception scope → proceed, record the decision rationale in the PR description, and let the merge gate the review.

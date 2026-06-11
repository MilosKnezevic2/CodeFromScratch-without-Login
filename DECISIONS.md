# DECISIONS.md — blog-cms (CodeFromScratch)

Material decisions, newest first. One entry per decision: date, what was
decided, why, and what it supersedes. Detailed April-2026 records live in
the archived governance repo
(`../ai-holding-os/firms/firm-b-enterprise/projects/active/blog-cms/`).

---

## 2026-06-09 — Governance simplified: archive the process, keep the documents

The `ai-holding-os` process layer (7 constitutions, 16 SOPs, 32 agents,
exceptions, L-levels, lifecycle logs) is retired by operator decision.
Evidence: zero governance files were touched after 2026-04-25 while the
product advanced ~100 commits, changed primary remote, and pivoted
strategy — the process did not survive solo-operator reality. The
*documents* (mission, legal/security baselines incl. GDPR/DPIA/processor
register, deploy playbook, rollback plan, content plan) remain a read-only
reference archive. Active rules: `CLAUDE.md`. Decisions: this file.
**Code quality bar is unchanged** (Lighthouse 100 target, strict TS,
security posture) — only the paperwork is gone.

## 2026-06-09 — Launch strategy ratified: content-first, DB-independent public site

Operator confirmed: launch the public journal (`without-login/main`) while
the SaaS backend is finished in private. Consequences implemented:
- Public surface (build + render) must not depend on Postgres. Admin and
  dashboard layouts are `force-dynamic`; public ebook routes degrade
  gracefully when the DB is unreachable.
- Sitemap and robots.txt advertise only the journal surface; hidden
  commerce/auth routes are disallowed until relaunch.
- Database stays on Supabase free tier (operator already has it; pausing
  is harmless once the public surface is decoupled). Re-evaluate provider
  at SaaS relaunch.

## 2026-06-09 — Repository roles fixed

`without-login` (CodeFromScratch-without-Login) is the primary remote:
`main` = public site, `dev` = full-SaaS development line. `origin`
(CodeFromScratch-Claude) is frozen as an archive of the April-2026 era
(PRs #1–#24). The ~70 unmerged April branches (stacked admin overview /
analytics / content admin / users / revenue / donations / newsletter /
inbox / studio / settings rebuild; +54 commits, 229 files, 12 new Prisma
models; only 5 files overlap with the pivot line) are **parked until
post-launch**. Merge order when resumed: newsletter family first (supports
audience growth), then admin overview/analytics, then the rest.

## 2026-06-09 — Brand and domain kept

"CodeFromScratch" stays. Exact domain to be confirmed at deploy time.

## 2026-05-14 — Content-first pivot (operator, recorded retroactively)

Public `main` hides all SaaS surfaces (nav login/ebooks/courses, save,
reactions, comments, view counter, premium gate and Premium/PRO badges)
because nothing is sellable yet and DB-dependent features were unstable.
`dev` re-enables them for parallel backend development. This pivot
superseded the April master-roadmap sequencing.

## 2026-04-25 — CMS path: K1 Sanity Studio customization (G4, operator "k1 go")

Keep Sanity storage + Studio; add AI Assist + Visual Editing rather than
migrating editors. Zero-migration, preserves blockContent investment.

## 2026-04-25 — Design direction: REFINE, not redesign (G3, operator)

Keep the current design foundation; targeted refinement (tokens, type
scale, palette, hero, reading surface). Redesign rejected on solo-capacity
opportunity-cost grounds.

## 2026-04-24 — Mission recorded; Class C posture; security hotfix

Mission R1–R5 captured (trusted full-stack platform / Lighthouse 100 /
account-takeover-proof / CMS as good as Word / SEO first-class). Admin-auth
bypass found and remediated with HMAC-signed sessions (PR #1). Honesty
fixes on homepage and /courses (PR #2). Full April record in the archive.

## 2026-06-10 — Content triage executed: 23 → 10 published articles

Audit found one real article (the May cover story, ~2,300 words) and 22
thin seeds (70–580 words, zero in-body images, mixed authors). Operator
approved: 9 strongest skeletons rewritten to the flagship standard
(1,500–2,200 words each, single voice, why-before-how, no schedule or
hype claims), unified under the Milos Knezevic author; 13 stubs
unpublished (off-stack Python/Go, superseded Next.js 15, stale "2025"
titles, sub-200-word stubs — recoverable from Sanity history, topics
return when written properly). "React State Management" retitled
2025 → 2026 (slug kept). Two stale April Studio drafts deleted — they
predated the May rewrite and would have reverted it if ever published.
Authoring pipeline: scripts/apply-content-refresh.mjs converts draft
JSON specs to Portable Text and patches Sanity; writer voice rules in
content-drafts/WRITER-GUIDE.md pattern (gitignored, recreate per batch).

## 2026-06-10 — Six-month content inventory created (18 drafts) + branded covers

The April content plan's 3-pillar architecture (Foundations /
Production-Grade Patterns / Ship It) written in full: 3 pillars
(2,900–3,300 words) + 15 clusters (1,700–2,300 words), interlinked
(pillars → all five clusters; clusters → pillar + siblings + published
articles), every internal link validated against real slugs. Created in
Sanity as status:"draft" with planned publishedAt dates Jul 1 – Dec 21,
2026 (see PUBLISHING-CALENDAR.md; pillar-before-cluster rule). All 28
posts (10 published + 18 drafts) now carry branded covers generated by
/api/og with per-category accent colours — stock photos retired.
Pipeline: scripts/create-inventory-posts.mjs.

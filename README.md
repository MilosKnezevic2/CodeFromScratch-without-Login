# CodeFromScratch — blog-cms

Premium web and software development content platform built on Next.js 16 and governed under the Firm B enterprise constitution.

## Status

Under active development. Not yet deployed to production. Security-critical admin-auth remediation is in flight (see PR #1). The admin portal is not safe to expose publicly until that fix merges and MFA lands.

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19 + React Compiler
- **Language:** TypeScript (strict)
- **Database:** PostgreSQL via Prisma 7
- **CMS:** Sanity v5 (Studio mounted at `/portal-cfs-admin/studio`)
- **Auth:** NextAuth v5 (beta) — Google, GitHub, credentials (bcrypt)
- **Payments:** Stripe v20 — subscriptions (FREE / PRO / PRO_PLUS) + ebook one-offs + webhooks
- **Email:** Resend v6 + six React Email templates + sequence engine
- **Styling:** Tailwind v4 + CSS variable tokens + framer-motion + next-themes
- **Content:** Portable Text + MDX + Shiki (syntax highlighting)
- **Analytics:** Plausible (env-gated; inactive until launch)

## Getting started

Prerequisites:

- Node.js LTS (v22+ recommended — matches CI)
- PostgreSQL 14+
- Sanity account + dataset

Clone and install:

```bash
git clone https://github.com/MilosKnezevic2/CodeFromScratch-Claude.git blog-cms
cd blog-cms
cp .env.example .env.local
# Fill in .env.local — see required variables below
npm ci
npm run db:push
npm run dev
```

Open <http://localhost:3000>.

## Required environment variables

See `.env.example` for the full list with inline descriptions. Minimum to boot:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `NEXTAUTH_SECRET` | 32+ character random string; signs admin sessions and NextAuth tokens |
| `NEXT_PUBLIC_SITE_URL` | The site's own origin (used for CSRF check and absolute URLs) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` + `NEXT_PUBLIC_SANITY_DATASET` | Sanity connection |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + price IDs | Stripe — test keys for dev |
| `RESEND_API_KEY` + `EMAIL_FROM` | Transactional email |
| `CFS_ADMIN_USERNAME` + `CFS_ADMIN_PASSWORD` | Admin-portal credentials (separate from NextAuth) |

OAuth providers (`GOOGLE_CLIENT_ID`, `GITHUB_ID`, etc.) are optional — credentials-based login works without them.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit + integration, once they land) |
| `npm run db:push` | Apply Prisma schema to the database |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:studio` | Prisma Studio (schema browser) |
| `npm run db:seed` | Run the seed script |

## Project layout

```
app/                         # Next.js App Router
  (auth)/                    # Auth route group
  api/                       # ~45 route handlers (Stripe, newsletter, ebooks, auth, admin...)
  blog/                      # Public blog (list, [slug], category, tag, rss.xml)
  dashboard/                 # Authenticated user dashboard
  portal-cfs-admin/          # Admin portal (separate credentials + signed session)
  courses/ ebooks/ pricing/ newsletter/ ...
  impressum/ privacy/ terms/ # Legal pages (AT/EU)
components/                  # Reusable React components
lib/                         # Utilities, Prisma client, Sanity helpers, auth, email, seo, etc.
prisma/schema.prisma         # Data model — 15 models
sanity/schemas/              # Sanity content schemas (post, category, tag, author, ebook)
public/                      # Static assets (manifest, icons, logo)
```

## Governance

This project runs under the **Firm B enterprise constitution** maintained in a separate repository. Relevant references:

- Project intake and classification: `firms/firm-b-enterprise/projects/active/blog-cms/project.md`
- Master roadmap: `firms/firm-b-enterprise/projects/active/blog-cms/docs/master-roadmap.md`
- Active exceptions (A1 / A2 / A3): `firms/firm-b-enterprise/projects/active/blog-cms/decisions/`
- Project classification: **Class C** (payments + auth + personal data + consumer-law surface)

The project-local AI assistant instructions live in `CLAUDE.md` at this repo's root. AI agents operating on this codebase are expected to read that file and the linked Firm B constitution before writing.

## Contributing

Branch discipline:

- `main` = production (auto-deployed once deploy target lands)
- `fix/*` = bug fixes
- `feat/*` = new features
- `update/*` = improvements to existing features
- No direct pushes to `main`. Every change goes through a PR with at least one reviewer (operator or independent AI reviewer).

All changes must:

- Pass `npm run lint`, `npx tsc --noEmit`, and `npm test` with zero failures.
- Maintain Lighthouse scores ≥ 95 on any public route touched (target 100 per Firm B R2 mission).
- Ship tests for critical-path changes (auth, payments, authorization, personal-data handling).
- Respect the prohibitions in `firms/firm-b-enterprise/constitution/coding-constitution.md §2`: no TODO/FIXME, no commented-out code, no `any`, no `@ts-ignore`, no silent failures.

## Security

Active findings and remediation are tracked in the Firm B governance tree. Current critical items:

- **PR #1** — admin-auth bypass (static literal session token); remediated with HMAC-signed sessions + 8 regression tests. Awaiting merge.
- Pre-existing `npm audit` items (50, mix of moderate/high) — advisory in CI, scheduled for remediation in the A3 refactor cycle.

If you discover a security issue, do not open a public issue. Contact the repository owner directly.

## License

Not yet licensed. Until a LICENSE file is added, all rights reserved.

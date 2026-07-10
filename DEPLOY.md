# DEPLOY.md — content-first launch walkthrough

Step-by-step deploy of the public journal to Vercel. Written for the
operator; every step says who does it (you or AI-assisted). The full
April playbook (Stripe live mode, lawyer checklist, FAGG wording) lives
in the governance archive and applies only to the later SaaS relaunch.

**Prerequisite reality check (already true):** production build passes
with the database unreachable; sitemap/robots advertise only the journal;
zero high/critical npm vulnerabilities.

## 1. Accounts (operator, ~30 min)

| Service | Plan | Purpose |
|---|---|---|
| Vercel | Hobby (free) | Hosting + daily keepalive cron |
| Supabase | Free (existing) | Newsletter sign-ups + contact form + admin |
| Resend | Free (existing key) | Confirmation + contact emails |
| Sanity | Free (existing) | Content |
| Google Search Console | Free | Indexing |
| Sentry, UptimeRobot, Plausible | Free, optional | Can be added after launch |

## 2. Wake and verify the database (operator + AI)

Supabase dashboard → project → if paused, **Restore/Resume**. Then locally:
`npm run db:push` to make sure the schema is applied. The daily
`/api/keepalive` cron keeps it awake permanently after launch.

## 3. Vercel project (operator with AI guidance, ~20 min)

1. vercel.com → Add New → Project → import the
   `CodeFromScratch-without-Login` GitHub repo.
2. Production branch: `main`. Framework preset: Next.js (auto).
3. Environment variables (Production) — copy values from `.env.local`:
   - `DATABASE_URL` (Supabase **pooled** connection string, port 6543)
   - `NEXTAUTH_SECRET` — generate fresh for production:
     `openssl rand -base64 32`
   - `NEXT_PUBLIC_SITE_URL` = `https://<your-domain>`
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`
   - `SANITY_API_READ_TOKEN` (viewer token, for draft preview)
   - `RESEND_API_KEY`, `EMAIL_FROM` (after §5 domain verification)
   - `CFS_ADMIN_USERNAME`, `CFS_ADMIN_PASSWORD` (strong, fresh),
     `CFS_ADMIN_MFA_SECRET` (recommended)
   - `CRON_SECRET` — any long random string
   - `SANITY_REVALIDATE_SECRET` — any long random string
     (`openssl rand -hex 32`); §6a wires the same value into Sanity
   - Skip for now: Stripe keys (commerce hidden), OAuth IDs (login
     hidden), Sentry (optional post-launch)
4. Deploy. Verify the `*.vercel.app` preview URL renders /, /blog, a post.

## 4. Domain (operator, ~15 min + DNS propagation)

Vercel → Project → Settings → Domains → add your domain. Set the DNS
records Vercel shows (A / CNAME) at your registrar. SSL is automatic.
Then update `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy.

## 5. Email domain verification (operator, ~15 min)

Resend dashboard → Domains → add the domain → set the SPF + DKIM (+ DMARC)
DNS records at the registrar. Set `EMAIL_FROM` to e.g.
`CodeFromScratch <hello@your-domain>`. Without this, newsletter
confirmations land in spam.

## 6. Sanity production origin (operator, 5 min)

sanity.io → project → API → CORS origins → add `https://<your-domain>`
(with credentials) so the Studio at `/portal-cfs-admin/studio` works.

## 6a. Sanity publish webhook (operator, 5 min)

sanity.io → project → API → Webhooks → create:
- URL: `https://<your-domain>/api/revalidate`, method POST, dataset
  `production`, trigger on create/update/delete.
- Projection: `{ _type, "slug": slug }`
- HTTP header: `x-revalidate-secret: <same value as SANITY_REVALIDATE_SECRET>`
  — the endpoint rejects calls without it, so publishing won't refresh the
  site cache until this header is set.

## 7. Post-deploy smoke test (AI-assisted, 15 min)

- `/` and `/blog` render; a post renders with images
- `/blog/rss.xml`, `/sitemap.xml`, `/robots.txt` respond
- Newsletter form: subscribe → confirmation email arrives → confirm link
  works
- Contact form: submission arrives (admin portal → contacts) + email
- `/portal-cfs-admin/login` works with the new credentials (+ TOTP)
- `/api/keepalive` returns `database: awake` (with bearer if CRON_SECRET)
- Hidden surfaces return correctly: `/pricing` reachable directly but
  absent from nav/sitemap; `/dashboard` redirects to login

## 8. Search Console (operator, 10 min)

Add property for the domain → verify via DNS → submit
`https://<domain>/sitemap.xml`.

## 9. First 48 hours

Watch Vercel logs + form deliveries. If anything breaks: Vercel →
Deployments → previous deployment → **Promote to Production** is the
instant rollback.

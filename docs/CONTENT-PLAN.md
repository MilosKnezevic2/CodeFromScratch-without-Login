# CONTENT-PLAN — 110 articles, 10 per category

Master editorial plan for the 2026-07 content wave. Every article in
`scripts/content/` is written from a brief below. Nothing ships that isn't
on this list; nothing on this list duplicates existing content.

## Ground rules

**Voice.** First-person practitioner (single author: Milos Knezevic).
Concrete, opinionated, generous. Open with a real problem or scene — never
"In this article we will…" and never "In today's fast-paced world".
Short paragraphs. Specific version numbers where they matter (Next.js 16,
React 19, TypeScript strict, Prisma 7, Tailwind 4, Postgres 16, Node 22).
Say "I" when telling war stories, "you" when guiding. No emoji in prose.

**Structure (every article).**
1. Hook — the concrete problem, bug, bill, or confusion the reader has.
2. "What you'll walk away with" — 2–4 bullet promises, plain language.
3. Fundamentals, labeled — beginners must be able to follow; define terms
   inline the first time.
4. The real content — runnable code with `filename` on every block;
   `callout("info"|"tip"|"warning", …)` for expert "Deeper:" notes,
   gotchas, and version caveats. Experts get depth in callouts and the
   later sections, beginners get the early sections — that is how one
   article serves both.
5. Gotchas / "when NOT to use this" — honest failure modes and trade-offs.
6. Wrap-up — what to do next + 2–3 internal links (see per-brief links).

**Anti-slop rules (hard).** No generic intros/outros; no symmetrical
listicles (vary section counts and lengths); no fabricated benchmarks,
quotes, or statistics — if you can't verify a number, don't print one;
no "delve", "harness the power", "game-changer", "in conclusion";
code must be syntactically correct, idiomatic, and match pinned versions;
every claim must be actionable or cut. Length 1,800–3,000 words
(readingTime ≈ words/220, set 9–14).

**SEO fields.** `seoTitle` ≤ 60 chars containing the target query's core;
`seoDescription` 140–160 chars, natural, includes the query once;
`excerpt` 120–200 chars, human, no keyword stuffing. Slug = slugified
title (lowercase, dashes).

**Tags.** Use ONLY: React, Next.js, TypeScript, Node.js, CSS, TailwindCSS,
PostgreSQL, Prisma & ORMs, Supabase, Docker, Vercel, Git & GitHub, GraphQL,
REST API Design, WebSockets & Realtime, Auth Systems, Jest & Vitest,
Testing Library, Cypress & Playwright, Web Performance & Core Web Vitals,
SEO & Technical SEO, Express.js, Python, Go (Golang) — plus three approved
new tags: **Security**, **Serverless**, **Caching**. 2–4 tags per article.

**Internal links.** Use the `link(text, "/blog/slug")` helper. Link only
slugs that exist or are earlier in the publish order; each brief lists
targets. Existing posts may be linked freely (list below).

## Do-not-duplicate list (existing + scheduled)

Live/seeded: Getting Started with Next.js 15 · Mastering Tailwind CSS ·
REST APIs with Node/Express · PostgreSQL for Web Developers · NextAuth v5
Authentication · Docker for Frontend Developers · TypeScript Generics ·
Web Performance Checklist · Git Workflow Strategies · WebSockets +
Next.js Real-Time · React State Management (Zustand/Redux/Context) · CSS
Grid Complete Guide · Prisma Zero-to-Production · Flask vs FastAPI ·
Deploying to Vercel · Supabase Authentication · Go for Web Development ·
Tailwind v4 Migration · GraphQL vs REST · Testing React Applications.

Scheduled (operator's calendar, keep dates): Modern Full-Stack 2026
(pillar) · App Router vs Pages Router · React Server Components ·
Prisma vs Drizzle · NextAuth vs Better Auth · Stripe Subscriptions ·
Production-Grade Code (pillar) · Zod at the Trust Boundary · Rate
Limiting Next.js APIs · Structured Logging · React Error Boundaries ·
Stripe Webhook Signatures · Shipping to Production (pillar) · Vercel vs
Self-Hosting · Neon vs Supabase vs Railway · Observability Solo ·
Rollback Strategies · Domains, DNS, SSL, Email.

## Publish schedule

Mon/Wed/Fri at 07:00 UTC, starting 2026-07-20. Publish order is
round-robin across categories (cycle 1 = article 1 of each category, in
the column order below), so no month is a single topic. Sequence → date:
`seq = (cycle-1)*11 + column`, dates per cycle:

| cycle | dates (2026-07 → 2027-03) |
|---|---|
| 1 | 07-20 · 07-22 · 07-24 · 07-27 · 07-29 · 07-31 · 08-03 · 08-05 · 08-07 · 08-10 · 08-12 |
| 2 | 08-14 · 08-17 · 08-19 · 08-21 · 08-24 · 08-26 · 08-28 · 08-31 · 09-02 · 09-04 · 09-07 |
| 3 | 09-09 · 09-11 · 09-14 · 09-16 · 09-18 · 09-21 · 09-23 · 09-25 · 09-28 · 09-30 · 10-02 |
| 4 | 10-05 · 10-07 · 10-09 · 10-12 · 10-14 · 10-16 · 10-19 · 10-21 · 10-23 · 10-26 · 10-28 |
| 5 | 10-30 · 11-02 · 11-04 · 11-06 · 11-09 · 11-11 · 11-13 · 11-16 · 11-18 · 11-20 · 11-23 |
| 6 | 11-25 · 11-27 · 11-30 · 12-02 · 12-04 · 12-07 · 12-09 · 12-11 · 12-14 · 12-16 · 12-18 |
| 7 | 12-21 · 12-23 · 12-25 · 12-28 · 12-30 · 01-01 · 01-04 · 01-06 · 01-08 · 01-11 · 01-13 |
| 8 | 01-15 · 01-18 · 01-20 · 01-22 · 01-25 · 01-27 · 01-29 · 02-01 · 02-03 · 02-05 · 02-08 |
| 9 | 02-10 · 02-12 · 02-15 · 02-17 · 02-19 · 02-22 · 02-24 · 02-26 · 03-01 · 03-03 · 03-05 |
| 10 | 03-08 · 03-10 · 03-12 · 03-15 · 03-17 · 03-19 · 03-22 · 03-24 · 03-26 · 03-29 · 03-31 |

Column order: 1 Web Fundamentals · 2 JavaScript Frameworks · 3 CSS
Ecosystem · 4 Backend Technologies · 5 Databases · 6 APIs & Integrations ·
7 Backend-as-a-Service · 8 DevOps & Infrastructure · 9 Cloud & Hosting ·
10 Testing · 11 Performance.

The operator's own calendar (3/month, 1st/11th/21st) continues in
parallel and takes precedence on conflicts — these dates never move his.

## Briefs

Format: `n. Title — q:"target query" · difficulty · tags · links`.
Difficulty spread per category: 2 beginner, 4 intermediate, 3 advanced,
1 opinion (difficulty as marked). "links" are wrap-up targets (slugs).

### 1 · Web Fundamentals

1. How the Browser Renders a Page: DOM, CSSOM, and the Critical Path — q:"how does the browser render a page" · beginner · [Web Performance & Core Web Vitals, CSS] · links: web-performance-optimization-a-developers-checklist
2. HTTP Caching Explained: Cache-Control, ETags, and Why Your Deploy Didn't Show Up — q:"http caching cache-control etag explained" · intermediate · [Caching, REST API Design] · links: (C9-3 CDN), how-the-browser-renders-a-page-dom-cssom-and-the-critical-path
3. The JavaScript Event Loop Without the Confusion: Tasks, Microtasks, and Starved UIs — q:"javascript event loop microtasks explained" · intermediate · [TypeScript, Node.js] · links: (C1-4 debounce), (C11-4 react rendering perf)
4. Debounce, Throttle, or requestAnimationFrame? Picking the Right Rate Limiter for the UI — q:"debounce vs throttle javascript" · beginner · [TypeScript, React] · links: (C1-3 event loop)
5. Semantic HTML That Actually Matters: Landmarks, Headings, and Forms That Work for Everyone — q:"semantic html accessibility guide" · intermediate · [CSS, SEO & Technical SEO] · links: (C1-1 rendering)
6. CORS Demystified: Why the Browser Blocks Your Fetch and the Server Is Always Right — q:"cors error explained fix" · advanced · [Security, REST API Design, Node.js] · links: (C6-7 first api call), building-rest-apis-with-nodejs-and-express
7. Content Security Policy in Practice: Locking Down a Real Site Without Breaking It — q:"content security policy nextjs practice" · advanced · [Security, Next.js] · links: (C1-6 CORS)
8. How JWTs Actually Work: Header, Claims, Signature — and the Mistakes That Get Sites Hacked — q:"how do jwt tokens work" · advanced · [Security, Auth Systems] · links: authentication-in-nextjs-with-nextauthjs-v5, (C4-5 session vs jwt)
9. URL, URLSearchParams, FormData: the Web APIs You Keep Reimplementing in Userland — q:"urlsearchparams formdata javascript guide" · intermediate · [TypeScript, Next.js] · links: (C2-5 server actions)
10. Frameworks Come and Go, the Platform Stays: the Case for Learning Web Fundamentals First — q:"should i learn javascript before react" · opinion/beginner · [React, TypeScript] · links: (C1-1), (C1-3)

### 2 · JavaScript Frameworks

1. Your First React Component, Properly: Props, State, and Thinking in React — q:"react components props state tutorial" · beginner · [React, TypeScript] · links: react-state-management-in-2025-zustand-vs-redux-vs-context
2. useEffect: When You Need It, When You Don't, and What to Reach for Instead — q:"react useeffect when to use alternatives" · intermediate · [React] · links: (C2-1), react-state-management-in-2025-zustand-vs-redux-vs-context
3. React Keys and Reconciliation: Why Your List Re-renders (or Renders Wrong) — q:"react keys reconciliation explained" · beginner · [React] · links: (C2-2 useEffect), (C11-4 profiling)
4. React Hook Form + Zod: Forms That Scale Past the Todo App — q:"react hook form zod validation" · intermediate · [React, Next.js, TypeScript] · links: (C2-5 server actions)
5. Server Actions in Next.js: Mutations Without an API Route — q:"nextjs server actions tutorial" · intermediate · [Next.js, React] · links: (C2-4 forms), getting-started-with-nextjs-15-the-complete-guide
6. Next.js Caching in Practice: fetch, revalidate, Tags, and the Cache You Forgot Existed — q:"nextjs caching revalidate explained" · advanced · [Next.js, Caching] · links: (C1-2 http caching), (C11-6 caching layers)
7. React Suspense and Streaming SSR, Explained with Real Waterfalls — q:"react suspense streaming ssr explained" · advanced · [React, Next.js] · links: (C2-6 caching), (C11-8 perceived perf)
8. The Edge Request Hook in Next.js: Auth Gates, Redirects, and Middleware/Proxy Constraints — q:"nextjs middleware auth redirect edge" · advanced · [Next.js, Security] · links: authentication-in-nextjs-with-nextauthjs-v5
9. React Compiler in Practice: What It Optimizes and What It Can't Save You From — q:"react compiler what does it do" · intermediate · [React, Next.js] · links: (C11-4 profiling first)
10. You Probably Don't Need That Framework Feature — q:"do i need nextjs advanced features" · opinion/intermediate · [Next.js, React] · links: (C2-6), (C2-7)

### 3 · CSS Ecosystem

1. Flexbox Mental Models: Stop Guessing align-items — q:"flexbox align-items justify-content explained" · beginner · [CSS] · links: css-grid-layout-the-complete-visual-guide
2. Modern CSS Layout Recipes: the Six Layouts You Keep Rebuilding — q:"modern css layout patterns examples" · beginner · [CSS, TailwindCSS] · links: (C3-1 flexbox), css-grid-layout-the-complete-visual-guide
3. Container Queries: Component-Responsive Design That Finally Works — q:"css container queries tutorial" · intermediate · [CSS] · links: (C3-2 recipes)
4. Dark Mode Done Right: CSS Variables, System Preference, and No Flash of Wrong Theme — q:"css dark mode variables no flash" · intermediate · [CSS, Next.js, React] · links: (C3-6 tokens)
5. :has(), :is(), :where() — the Selectors That Replace JavaScript — q:"css has is where selectors explained" · intermediate · [CSS] · links: (C3-3 container queries)
6. Design Tokens in Practice: From Figma Variables to CSS Custom Properties — q:"design tokens css custom properties workflow" · advanced · [CSS, TailwindCSS] · links: (C3-4 dark mode), mastering-tailwind-css-from-basics-to-advanced-patterns
7. Cascade Layers (@layer): Ending Specificity Wars in Large Codebases — q:"css cascade layers explained" · advanced · [CSS] · links: (C3-6 tokens)
8. Fluid Typography and Spacing with clamp(): One Formula, Every Screen — q:"css clamp fluid typography" · intermediate · [CSS, TailwindCSS] · links: (C3-2 recipes)
9. Scroll-Driven Animations in Pure CSS — q:"css scroll driven animations" · advanced · [CSS] · links: (C3-5 selectors), (C11-8 perceived perf)
10. Tailwind Isn't the Problem — Your Abstractions Are — q:"tailwind css criticism maintainable" · opinion/intermediate · [TailwindCSS, CSS] · links: mastering-tailwind-css-from-basics-to-advanced-patterns, tailwind-css-v4-whats-new-and-how-to-migrate

### 4 · Backend Technologies

1. Getting Started with Node.js in 2026: the Parts That Matter — q:"getting started nodejs backend guide" · beginner · [Node.js, TypeScript] · links: building-rest-apis-with-nodejs-and-express
2. Environment Variables Done Right: Validation, Types, and Secret Hygiene — q:"nodejs environment variables validation typescript" · beginner · [Node.js, TypeScript, Security] · links: (C8-4 secrets)
3. Background Jobs in Node.js: Queues, Workers, and When a Cron Is Enough — q:"nodejs background jobs queue tutorial" · intermediate · [Node.js] · links: (C4-6 error handling)
4. File Uploads That Don't Fall Over: Multipart, Presigned URLs, and Limits — q:"file upload nodejs presigned url" · intermediate · [Node.js, Next.js] · links: (C9-5 object storage)
5. Sessions vs JWTs (vs Paseto): Choosing Auth Storage for Real Apps — q:"session vs jwt authentication" · advanced · [Auth Systems, Security] · links: (C1-8 jwt internals), authentication-in-nextjs-with-nextauthjs-v5
6. Node.js Error Handling Patterns: Operational vs Programmer Errors — q:"nodejs error handling best practices" · intermediate · [Node.js, TypeScript] · links: (C4-3 jobs)
7. Node.js Streams Explained: Processing Gigabytes Without Melting RAM — q:"nodejs streams explained example" · advanced · [Node.js] · links: (C4-4 uploads)
8. Building CLI Tools in TypeScript That Your Team Actually Uses — q:"build cli tool typescript nodejs" · intermediate · [TypeScript, Node.js] · links: (C4-2 env vars)
9. Webhooks End-to-End: Designing, Receiving, and Debugging Them Without Tears — q:"webhooks explained receive design" · advanced · [REST API Design, Node.js, Security] · links: (C6-3 third-party APIs)
10. Boring Backend Wins: Why I Still Ship Monoliths — q:"monolith vs microservices small team" · opinion/intermediate · [Node.js] · links: (C4-1), (C8-9 kubernetes)

### 5 · Databases

1. SQL Joins Finally Click: a Visual, Practical Walkthrough — q:"sql joins explained visually" · beginner · [PostgreSQL] · links: postgresql-for-web-developers-a-practical-guide
2. Modeling Data for a SaaS: From Napkin Sketch to Schema — q:"database schema design saas example" · beginner · [PostgreSQL, Prisma & ORMs] · links: (C5-1 joins), prisma-orm-from-zero-to-production
3. Database Indexes: What They Are, When They Help, When They Hurt — q:"database indexes explained postgres" · intermediate · [PostgreSQL] · links: (C5-1 joins)
4. N+1 Queries: Finding Them in Prisma and Killing Them for Good — q:"n+1 query problem prisma fix" · intermediate · [Prisma & ORMs, PostgreSQL] · links: (C5-3 indexes), prisma-orm-from-zero-to-production
5. Full-Text Search in Postgres: tsvector, GIN, and Ranking Without Elasticsearch — q:"postgres full text search tsvector" · intermediate · [PostgreSQL] · links: (C5-3 indexes)
6. Connection Pooling Explained: PgBouncer, Serverless, and "Too Many Connections" — q:"postgres connection pooling serverless" · intermediate · [PostgreSQL, Serverless] · links: (C9-4 cold starts)
7. Transactions and Isolation Levels, Explained with Real Bugs — q:"database transactions isolation levels explained" · advanced · [PostgreSQL, Prisma & ORMs] · links: (C5-4 n+1)
8. Migrations Without Fear: Schema Changes on a Live Database — q:"database migrations zero downtime" · advanced · [PostgreSQL, Prisma & ORMs] · links: (C5-7 transactions), (C8-3 zero-downtime deploys)
9. Postgres Row-Level Security in Practice — q:"postgres row level security tutorial" · advanced · [PostgreSQL, Security] · links: (C7-6 RLS with Supabase)
10. You Don't Need NoSQL: Postgres Is Enough Until It Isn't — q:"postgres vs nosql when" · opinion/intermediate · [PostgreSQL] · links: (C5-5 fts), (C5-9 rls)

### 6 · APIs & Integrations

1. REST API Design that Ages Well: Naming, Versioning, and Errors — q:"rest api design best practices" · intermediate · [REST API Design, Node.js] · links: building-rest-apis-with-node-js-and-express
2. Pagination Patterns: Offset, Cursor, Keyset — Pick per Use-Case — q:"api pagination cursor vs offset" · intermediate · [REST API Design, PostgreSQL] · links: (C6-1 design)
3. Consuming Third-Party APIs Safely: Timeouts, Retries, Backoff, Idempotency — q:"api timeouts retries backoff pattern" · advanced · [REST API Design, Node.js] · links: (C4-9 webhooks)
4. OAuth 2.0 From First Principles: What Happens When You "Sign in with Google" — q:"oauth 2 explained simply" · advanced · [Auth Systems, Security] · links: (C4-5 sessions vs jwt), supabase-authentication-complete-guide-with-nextjs
5. Server-Sent Events: the Real-Time Option Everyone Forgets — q:"server sent events vs websockets" · intermediate · [WebSockets & Realtime, Node.js] · links: building-real-time-features-with-websockets-and-nextjs
6. API Error Design: RFC 9457 Problem Details and Messages Humans Can Act On — q:"api error response format best practice" · intermediate · [REST API Design] · links: (C6-1 design), (C4-6 error patterns)
7. Your First API Call: fetch, JSON, and Everything That Can Go Wrong — q:"how to call an api javascript fetch" · beginner · [TypeScript, REST API Design] · links: (C6-1)
8. Email for Developers: SPF, DKIM, DMARC, and Actually Landing in the Inbox — q:"spf dkim dmarc explained developers" · beginner · [Node.js, Security] · links: (C4-9 webhooks)
9. Building a Public API Developers Love: Keys, Quotas, Docs, Versioning — q:"how to build public api keys quotas" · advanced · [REST API Design, Security] · links: (C6-2 pagination), (C6-6 errors)
10. GraphQL Was Never the Problem — q:"is graphql dead 2026" · opinion/intermediate · [GraphQL, REST API Design] · links: graphql-vs-rest-when-to-use-each-in-2025

### 7 · Backend-as-a-Service

1. What Is a BaaS, Really? Supabase and Firebase Explained for Skeptics — q:"what is backend as a service" · beginner · [Supabase] · links: supabase-authentication-complete-guide-with-nextjs
2. Your First Database Without a Backend: Supabase From Zero — q:"supabase tutorial beginners database" · beginner · [Supabase, PostgreSQL] · links: (C7-1 what is baas)
3. Supabase Storage: Uploads, Transformations, and Access Policies — q:"supabase storage upload policies" · intermediate · [Supabase] · links: (C4-4 uploads)
4. Realtime with Supabase: Subscriptions Without WebSocket Plumbing — q:"supabase realtime subscriptions tutorial" · intermediate · [Supabase, WebSockets & Realtime] · links: (C6-5 sse), building-real-time-features-with-websockets-and-nextjs
5. Supabase Edge Functions vs Next.js API Routes: Where Should Logic Live? — q:"supabase edge functions vs api routes" · intermediate · [Supabase, Next.js, Serverless] · links: (C9-7 edge vs regional)
6. Postgres RLS as Your Authorization Layer: the Supabase Way — q:"supabase row level security policies" · advanced · [Supabase, PostgreSQL, Security] · links: (C5-9 rls internals)
7. Firebase vs Supabase in 2026: an Honest, Migration-Tested Comparison — q:"firebase vs supabase 2026" · intermediate · [Supabase] · links: (C7-1)
8. Self-Hosting Supabase: What It Actually Takes — q:"self host supabase docker" · advanced · [Supabase, Docker] · links: (C8-2 compose), (C9-2 vps)
9. BaaS Cost Traps: Free Tiers, Egress, and the Bill That Surprises You — q:"supabase firebase pricing traps" · advanced · [Supabase] · links: (C9-10 cloud bill), (C7-8 self-host)
10. When to Leave Your BaaS — q:"when to migrate off supabase firebase" · opinion/intermediate · [Supabase] · links: (C7-8), (C7-9)

### 8 · DevOps & Infrastructure

1. CI/CD with GitHub Actions: a Pipeline You Can Actually Read — q:"github actions ci cd tutorial nodejs" · beginner · [Git & GitHub, Docker] · links: git-workflow-strategies-for-development-teams
2. Docker Compose for Local Dev: One Command, Whole Stack — q:"docker compose local development setup" · intermediate · [Docker, PostgreSQL] · links: docker-for-frontend-developers-a-practical-introduction
3. Zero-Downtime Deploys Explained: Health Checks, Draining, Blue-Green — q:"zero downtime deployment explained" · advanced · [Docker, Node.js] · links: (C5-8 migrations), (C8-1 ci)
4. Secrets Management for Small Teams: From .env Files to Something You Can Rotate — q:"secrets management small team env" · intermediate · [Security, Docker] · links: (C4-2 env vars)
5. Reverse Proxies for App Developers: Nginx and Caddy Basics — q:"nginx caddy reverse proxy tutorial" · beginner · [Node.js, Docker] · links: (C9-2 vps)
6. Monitoring That Matters: Four Golden Signals for a Web App — q:"web app monitoring golden signals" · intermediate · [Node.js] · links: (C8-8 logs)
7. Infrastructure as Code, Gently: Terraform for App Developers — q:"terraform tutorial application developers" · advanced · [Docker] · links: (C8-4 secrets)
8. Log Aggregation on a Budget: From grep to Structured Pipelines — q:"log aggregation self hosted budget" · intermediate · [Node.js, Docker] · links: (C8-6 monitoring)
9. Kubernetes: Do You Need It? an Honest Decision Tree — q:"do i need kubernetes small app" · advanced · [Docker] · links: (C4-10 monoliths), (C8-3 deploys)
10. Deploy on Friday: What It Takes to Not Fear Releases — q:"deploy on friday devops culture" · opinion/intermediate · [Git & GitHub, Docker] · links: (C8-1 ci), (C8-3 zero-downtime)

### 9 · Cloud & Hosting

1. Your First Deploy: From Localhost to a Real URL, Step by Step — q:"how to deploy website first time" · beginner · [Vercel] · links: deploying-full-stack-apps-to-vercel-the-definitive-guide
2. A VPS in 2026: a Hetzner/DigitalOcean Setup That's Secure Enough — q:"vps setup guide secure 2026" · intermediate · [Docker, Security] · links: (C8-5 reverse proxy)
3. CDNs Explained: Cache Keys, Invalidation, and Why Users See Old Content — q:"how do cdns work cache invalidation" · intermediate · [Caching, Vercel] · links: (C1-2 http caching)
4. Serverless Cold Starts: What Causes Them and What Actually Helps — q:"serverless cold start causes fixes" · advanced · [Serverless, Vercel] · links: (C5-6 pooling)
5. Object Storage for App Developers: S3-Compatible Beyond the Bucket Basics — q:"s3 object storage guide developers" · intermediate · [Node.js, Serverless] · links: (C4-4 uploads)
6. Hosting a Side Project for (Almost) $0: a Realistic Free-Tier Architecture — q:"host side project free tier architecture" · beginner · [Vercel, Supabase, Serverless] · links: (C9-1 first deploy), (C7-9 cost traps)
7. Edge Functions vs Regional Servers: the Latency Math That Decides It — q:"edge functions vs server latency" · advanced · [Serverless, Vercel, Next.js] · links: (C9-4 cold starts)
8. Bandwidth, Egress, and Image Bills: Where Hosting Costs Actually Come From — q:"vercel bandwidth costs explained" · intermediate · [Vercel, Caching] · links: (C11-3 images), (C7-9 baas costs)
9. Multi-Region Won't Save You: Designing for the Failures You Actually Have — q:"multi region architecture worth it" · advanced · [Serverless, PostgreSQL] · links: (C8-6 monitoring)
10. The Cloud Bill Is a Product Decision — q:"reduce cloud costs startup" · opinion/intermediate · [Vercel, Serverless] · links: (C9-8 bandwidth), (C9-6 free tier)

### 10 · Testing

1. Vitest From Zero: Fast Unit Tests for Modern TypeScript Projects — q:"vitest tutorial typescript" · beginner · [Jest & Vitest, TypeScript] · links: testing-react-applications-a-complete-strategy
2. Test-Driving a Bug Fix: Regression Tests as a Habit — q:"regression test bug fix workflow" · beginner · [Jest & Vitest] · links: (C10-1 vitest)
3. What to Test (and What Not To): a Pragmatic Strategy for Small Teams — q:"what to test unit integration e2e strategy" · intermediate · [Jest & Vitest, Testing Library] · links: testing-react-applications-a-complete-strategy, (C10-2)
4. Mocking Done Right: vi.mock, Dependency Injection, and the Line Between — q:"vitest mocking best practices" · intermediate · [Jest & Vitest, TypeScript] · links: (C10-1), (C10-5 server tests)
5. Testing Next.js Server Code: Route Handlers, Server Actions, Mocked Prisma — q:"test nextjs api routes server actions" · intermediate · [Jest & Vitest, Next.js, Prisma & ORMs] · links: (C10-4 mocking)
6. Playwright E2E That Doesn't Flake: Selectors, Waits, and CI — q:"playwright flaky tests fix ci" · advanced · [Cypress & Playwright] · links: (C10-3 strategy), (C8-1 ci)
7. Contract Testing APIs: Schemas as Executable Documentation — q:"api contract testing schema" · advanced · [Jest & Vitest, REST API Design] · links: (C6-6 error design)
8. Property-Based Testing in TypeScript: fast-check in Practice — q:"property based testing typescript fast-check" · advanced · [Jest & Vitest, TypeScript] · links: (C10-4 mocking)
9. Coverage Is a Compass, Not a Goal: Reading Reports Usefully — q:"test coverage how much is enough" · intermediate · [Jest & Vitest] · links: (C10-3 what to test)
10. Flaky Tests Are a Culture Problem — q:"flaky tests causes culture" · opinion/intermediate · [Cypress & Playwright, Jest & Vitest] · links: (C10-6 playwright)

### 11 · Performance

1. Measuring Before Optimizing: Lighthouse, WebPageTest, and Real-User Data — q:"how to measure website performance properly" · beginner · [Web Performance & Core Web Vitals] · links: web-performance-optimization-a-developers-checklist
2. Core Web Vitals in 2026: LCP, INP, CLS — Measured, Explained, Fixed — q:"core web vitals lcp inp cls fix" · intermediate · [Web Performance & Core Web Vitals, SEO & Technical SEO] · links: (C11-1 measuring)
3. Image Performance End-to-End: Formats, Sizing, Lazy Loading, CDNs — q:"image optimization website formats lazy loading" · beginner · [Web Performance & Core Web Vitals, Next.js] · links: (C11-2 cwv), (C9-3 cdn)
4. React Rendering Performance: Profile First, Memo Later — q:"react performance profiling memo" · advanced · [React, Web Performance & Core Web Vitals] · links: (C2-9 react compiler), (C2-3 keys)
5. Font Loading Without the FOUT/FOIT Drama — q:"font loading performance fout foit" · intermediate · [CSS, Web Performance & Core Web Vitals] · links: (C11-2 cwv)
6. The Caching Layers of a Full-Stack App: Browser → CDN → App → Database — q:"full stack caching layers explained" · advanced · [Caching, Next.js, PostgreSQL] · links: (C1-2 http), (C2-6 nextjs caching), (C9-3 cdn)
7. The JavaScript Bundle Diet: Finding and Cutting What You Ship — q:"reduce javascript bundle size nextjs" · intermediate · [Next.js, Web Performance & Core Web Vitals] · links: (C11-4 react perf)
8. Perceived Performance: Skeletons, Optimistic UI, and When They Backfire — q:"perceived performance skeleton optimistic ui" · intermediate · [React, Web Performance & Core Web Vitals] · links: (C2-7 suspense)
9. Performance Budgets in CI: Fast by Default — q:"performance budget ci lighthouse" · advanced · [Web Performance & Core Web Vitals, Git & GitHub] · links: (C11-7 bundle), (C8-1 ci)
10. Performance Is a Feature Your Users Can't Name — q:"why website performance matters business" · opinion/intermediate · [Web Performance & Core Web Vitals, SEO & Technical SEO] · links: (C11-1), (C11-2)

## Batch tracker

Batches of ~11 (one full cycle) per day. Status: ☐ pending / ✅ written.

- Batch 1 (cycle 1, seq 1–11): ✅ written 2026-07-15 — `scripts/content/cycle-01-*.mjs`
- Batch 2 (cycle 2, seq 12–22): ☐
- Batch 3 (cycle 3, seq 23–33): ☐
- Batch 4 (cycle 4, seq 34–44): ☐
- Batch 5 (cycle 5, seq 45–55): ☐
- Batch 6 (cycle 6, seq 56–66): ☐
- Batch 7 (cycle 7, seq 67–77): ☐
- Batch 8 (cycle 8, seq 78–88): ☐
- Batch 9 (cycle 9, seq 89–99): ☐
- Batch 10 (cycle 10, seq 100–110): ☐

After each batch: editorial QA pass, `node --check` every file,
`node scripts/seed-content.mjs --dry`, lint+tsc+test, commit, push, merge
to main. Import into Sanity is the operator's single command:
`node scripts/seed-content.mjs` (idempotent — safe after any batch).

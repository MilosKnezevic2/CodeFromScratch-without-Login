# MARKETING.md — CodeFromScratch growth plan

Owner: Miloš. Channels: SEO + newsletter + organic social (decided April
2026 — no paid ads until revenue justifies them). Time budget assumption:
~4–6 h/week of marketing alongside writing. Everything here is sized to
that reality.

## 1. The engine (how this site grows)

```
Google search → article → newsletter signup → reader returns → shares
        ↑                                                        │
        └────────────── internal links + new articles ←──────────┘
```

SEO compounds: each published article targets one query, links into the
pillar structure, and lifts every other article. The newsletter converts
one-time searchers into returning readers. Social is a spark, not the
engine — it seeds early traffic and backlinks while Google warms up
(expect 3–6 months before meaningful organic traffic; that is normal,
not failure).

## 2. One-time launch checklist (this week)

- [x] Domain live with SSL (codefromscratch.org)
- [x] Sitemap + robots + JSON-LD (Article, Breadcrumb, FAQ, Organization,
      Person/E-E-A-T)
- [x] Cookieless analytics (Vercel) + Core Web Vitals monitoring
- [x] Verified email sending (Resend, SPF/DKIM) + office@ mailbox
- [ ] **Google Search Console: click Verify, submit sitemap.xml** ← the
      single highest-leverage click remaining
- [ ] Bing Webmaster Tools (free, imports from GSC in 2 clicks — Bing
      powers ChatGPT/Copilot answers, devs use those)
- [ ] Claim @codefromscratch (or closest) on X and LinkedIn; bio links to
      the site; person account > brand account for a single-voice brand
- [ ] GitHub profile README links to the journal (devs check GitHub first)
- [ ] dev.to account for cross-posting (see §4)

## 3. Publishing rhythm (Jul–Dec, already inventoried)

3 articles/month are written and scheduled (PUBLISHING-CALENDAR.md).
Marketing work per article is a fixed 60–90 min checklist:

1. Read once as a reader; fix anything that snags.
2. Publish in Studio (pillar before its clusters).
3. Share on X: not "New post 🔗" — pull the single most contrarian or
   useful claim from the article as the hook, 2–4 sentences, link in
   reply or at the end. Same for LinkedIn (longer form works there).
4. Cross-post to dev.to **with canonical_url set to your domain** (free
   backlink + their audience; canonical protects your SEO).
5. If the article genuinely answers a recurring question: find ONE
   recent Reddit/Stack Overflow/forum thread asking it and write a real
   answer that happens to link the article. One. Spam kills accounts and
   reputation.
6. Newsletter goes out automatically to subscribers (the letter IS the
   distribution for returning readers).

## 4. Channel playbook

**SEO (primary).** Already engineered: pillar/cluster interlinking,
per-query targeting, structured data, CWV monitoring. Ongoing work =
publish on schedule + check GSC monthly: which queries get impressions
without clicks (→ improve that title/description), which articles rank
8–20 (→ expand/refresh them first; easiest wins).

**Newsletter (retention).** Signup forms exist site-wide. Growth levers
in order of effort: (1) keep writing — every article has inline capture;
(2) add a content-upgrade lead magnet later (e.g. "Production-readiness
checklist PDF" from the pillar — infrastructure exists); (3) mention the
letter once per article body where natural.

**X / LinkedIn (spark).** Goal is not followers; it is being findable
and occasionally cited. Post when publishing (see §3) + optionally 1–2
standalone insights/week pulled from articles you already wrote (zero
new writing — quote your own paragraphs).

**dev.to (borrowed audience).** Full cross-post, canonical to your
domain, 2 days after publishing (let Google index the original first).

**Hacker News / Reddit (lottery tickets).** Only submit genuinely
strong pieces (pillars). A pillar that lands on HN = months of traffic +
backlinks; one that doesn't costs 5 minutes. Never argue in comments.

## 5. Measurement (monthly, 30 minutes, first Monday)

| Metric | Where | 6-month bar (from April criteria) |
|---|---|---|
| Organic clicks + impressions | Search Console | trending up monthly |
| Visitors, top pages, referrers | Vercel Analytics | 1k+/mo by month 6 |
| Newsletter subscribers | Admin portal | 100+ by month 6 |
| Queries ranking 8–20 | GSC | pick 1/mo to improve |
| Core Web Vitals | Speed Insights | all green |

Review against the ratified criteria: month-6 organic < 1,000 sessions →
reassess positioning (not panic — reassess). Month-12 targets: 10k
organic sessions, 1k subscribers.

## 6. What we deliberately do NOT do (yet)

- Paid ads (no revenue to feed them)
- YouTube/video (different craft, huge time cost — revisit at traction)
- Posting daily on social (cadence theater; publishing is the job)
- Engagement-bait threads ("10 VS Code tricks 🧵") — off-brand; the brand
  is depth and honesty
- SEO tricks (PBNs, AI content farms, keyword stuffing) — the moat IS
  quality

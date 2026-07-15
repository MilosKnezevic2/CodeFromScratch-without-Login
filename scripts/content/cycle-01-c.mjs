/**
 * Content wave — cycle 1, part C (docs/CONTENT-PLAN.md):
 *   C7-1 · Backend-as-a-Service   · 2026-08-03 · What Is a BaaS, Really?
 *   C8-1 · DevOps & Infrastructure · 2026-08-05 · CI/CD with GitHub Actions
 *   C9-1 · Cloud & Hosting        · 2026-08-07 · Your First Deploy
 */
import { p, h2, h3, code, callout, bold, inlineCode, link, richP, bullet, bulletRich, numbered } from "./pt.mjs";

export const posts = [
  // ───────────────────────────────────────────────────────────────────────
  // C7-1 · What Is a BaaS, Really? Supabase and Firebase Explained for Skeptics
  // ───────────────────────────────────────────────────────────────────────
  {
    title: "What Is a BaaS, Really? Supabase and Firebase Explained for Skeptics",
    excerpt:
      "Everyone keeps telling you to just use Supabase. Here's what a BaaS actually bundles, what stays your job no matter what, and the same feature built both ways so you can see the tradeoff.",
    categoryName: "Backend-as-a-Service",
    tagNames: ["Supabase", "PostgreSQL"],
    difficulty: "beginner",
    seoTitle: "What Is Backend as a Service? Supabase & Firebase Explained",
    seoDescription:
      "What is backend as a service, really? What Supabase and Firebase actually bundle, what stays your job either way, and when you should skip a BaaS entirely.",
    publishDate: "2026-08-03",
    readingTime: 11,
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80",
    imageAlt: "Laptop on a desk displaying colorful analytics charts and graphs on its screen",
    content: [
      p("You built the frontend in a weekend. The form validates, the state updates, the data lives in useState — and now you need the part that survives a page refresh. A database. User accounts. An email to yourself when someone signs up. You ask how long that part takes, and the answer arrives instantly, from three different people: “just use Supabase.”"),
      p("If that sentence makes you suspicious, good. “Just use X” is how developers end up running stacks they can't explain. Supabase and Firebase have marketing budgets, conference booths, and free tiers engineered to feel like magic — and none of that tells you what you're actually buying, or what you're quietly giving up. So let's take the pitch apart piece by piece."),
      richP(bold("What you'll walk away with:"), " four things, none of them a sales pitch."),
      ...bullet([
        "A plain-language definition of Backend as a Service — what's actually in the box",
        "The list of things that stay your job no matter which provider you pick",
        "The same feature built twice — bare Express + Postgres, then Supabase — so you can see the tradeoff in code instead of adjectives",
        "Where the abstraction leaks, and who should skip a BaaS entirely",
      ]),

      h2("The name is the worst part"),
      p("Backend as a Service (BaaS) means: a company runs the generic parts of a backend for you, and you talk to those parts through a client library and a dashboard. That's the entire idea. The name suggests you don't need a backend, which is exactly wrong — you very much have one, you just didn't install it."),
      p("What makes a backend part “generic”? Nearly every app with users needs the same five things, and developers rebuilt them from scratch for decades before someone thought to sell the bundle:"),
      ...bulletRich([
        [bold("A database."), " Supabase gives you a real, managed PostgreSQL instance — the same Postgres you could install yourself, reachable with a normal connection string. Firebase gives you Firestore, a proprietary document database with its own query model."],
        [bold("Authentication."), " Sign-up, sign-in, password resets, “Sign in with Google”, session handling. The part that takes weeks to build well and one mistake to build catastrophically."],
        [bold("File storage."), " Avatars and PDF uploads kept somewhere durable, with URLs and access rules."],
        [bold("Realtime."), " Pushing changes to connected browsers, so the new chat message appears without a refresh."],
        [bold("Serverless functions."), " Small pieces of server code the platform runs on demand — a home for logic that must not live in the browser, without a server of your own."],
      ]),
      p("A BaaS bundles those five, wires them together, and bills you by usage. That's the honest definition; everything else on the landing page is decoration. Firebase (Google's, the elder) and Supabase (the challenger built around Postgres) are the two names you'll hear most — same bundle, very different database at the center."),
      callout("info", "Deeper: the piece skeptics underrate is the auto-generated API. Supabase runs PostgREST, which turns your database schema into a queryable REST API on the spot — every table, with filters and joins, zero route handlers written. It's also what makes row-level security non-optional, which we'll get to."),

      h2("What you still own, no matter what the landing page says"),
      p("Here's the sentence I'd print on every BaaS homepage if I could: the platform runs your infrastructure, not your application. Four things remain entirely and permanently yours."),
      ...bulletRich([
        [bold("The data model."), " Nobody at Supabase knows whether an order belongs to a user or to a team. Tables, columns, relationships, constraints — designing them is the real engineering work, and getting them wrong hurts exactly as much as it does on a self-hosted database."],
        [bold("Authorization rules."), " Authentication (who are you?) comes in the box. Authorization (what are you allowed to touch?) does not, because it is business logic. “Users can read their own invoices, admins can read all of them” is a rule you write — as row-level security policies on Supabase, as security rules on Firebase. Write none, and everyone can read everything."],
        [bold("Business logic."), " Pricing calculations, state machines, “send the receipt once payment settles.” The platform gives you places to put this code. It does not contain the code."],
        [bold("Costs."), " Usage-based pricing makes your bill a function of your queries, storage, and egress — the data flowing out of the platform to your users. You own that function whether or not you've read it."],
      ]),
      p("If you keep one line from this article, keep this one: a BaaS deletes your plumbing, not your thinking."),

      h2("The same feature, built twice"),
      p("Adjectives are cheap, so let's build something. The feature: a contact form saves a lead into the database and emails you a notification. Small, real, and it touches storage, validation, and a side effect — a fair sample of everyday backend work."),
      h3("Version one: Express + Postgres, no platform"),
      p("The do-it-yourself version needs an Express route, a pg connection pool, Zod for validation — types don't check data at runtime; a validation library does — and an email API call."),
      code("js", `import express from "express";
import { Pool } from "pg";
import { z } from "zod";
import { Resend } from "resend";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
app.use(express.json());

const leadSchema = z.object({
  email: z.email(),
  message: z.string().min(10).max(2000),
});

app.post("/api/leads", async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "A valid email and a message are required." });
  }

  const { email, message } = parsed.data;
  try {
    await pool.query(
      "INSERT INTO leads (email, message) VALUES ($1, $2)",
      [email, message],
    );
    await resend.emails.send({
      from: "forms@yourdomain.com",
      to: "you@yourdomain.com",
      subject: \`New lead from \${email}\`,
      text: message,
    });
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("saving lead failed", err);
    return res.status(500).json({ error: "Could not save your message. Try again." });
  }
});

app.listen(3001);`, "server.js"),
      p("It also needs a table, which means a migration you write and run yourself:"),
      code("text", `create table leads (
  id bigint generated always as identity primary key,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);`, "migrations/001_create_leads.sql"),
      p("About forty lines, and they're honest lines: validation at the boundary, parameterized SQL, an error path that logs and answers with a 500. But the file is the small half of the work. Before this handler serves one request from a stranger, you still have to:"),
      ...bullet([
        "Provision a PostgreSQL server somewhere and run that migration against it",
        "Host the Node process: a machine or container, restarts when it crashes, deploys when you push",
        "Put TLS in front of it so the form isn't posting over plain HTTP",
        "Keep Postgres healthy: backups, upgrades, disk space, connection limits",
      ]),
      p("None of this is hard the tenth time you do it. All of it is hard the first time, and it's a solid week of first times before your form saves its first row."),
      h3("Version two: the same feature on Supabase"),
      p("Now the BaaS version. The table is created with the same SQL — Supabase is regular Postgres, so migrations work the way migrations always work. The insert, though, happens straight from your frontend code through the client library:"),
      code("ts", `import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const leadSchema = z.object({
  email: z.email(),
  message: z.string().min(10).max(2000),
});

export async function saveLead(input: unknown) {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "A valid email and a message are required." };
  }

  const { error } = await supabase.from("leads").insert(parsed.data);
  if (error) {
    console.error("saving lead failed", error);
    return { ok: false, error: "Could not save your message. Try again." };
  }
  return { ok: true };
}`, "lib/save-lead.ts"),
      p("The notify half moves out of the request path entirely: a database webhook fires whenever a row lands in leads and calls an edge function — a small serverless function running close to your users — which sends the email:"),
      code("ts", `Deno.serve(async (req) => {
  const { record } = await req.json();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${Deno.env.get("RESEND_API_KEY")}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "forms@yourdomain.com",
      to: "you@yourdomain.com",
      subject: \`New lead from \${record.email}\`,
      text: record.message,
    }),
  });

  return new Response(res.ok ? "sent" : "email failed", {
    status: res.ok ? 200 : 502,
  });
});`, "supabase/functions/notify-lead/index.ts"),
      p("No server process, no host to patch, no TLS certificate, no Postgres to babysit. Deploying the function is one CLI command. That's the trade at its best — and notice what did not disappear: the validation is still there, the table still had to be designed, and a new non-optional line item appeared. Because the browser talks to the database directly using a public key, row-level security decides what that key may do:"),
      code("text", `alter table leads enable row level security;

-- The public key may add a lead...
create policy "anyone can submit a lead"
  on leads
  for insert
  to anon
  with check (true);

-- ...and that is all it may do. No select policy exists,
-- so reading leads requires elevated credentials.`, "supabase/migrations/002_leads_rls.sql"),
      richP("Row-level security (RLS) is Postgres enforcing per-row access rules inside the database itself. Without the ", inlineCode("insert"), " policy above, the form's insert comes back rejected. Without RLS enabled at all, anyone holding your public key — which is everyone, since it ships inside your JavaScript bundle — could read every lead ever submitted. The plumbing left; the security thinking stayed."),

      h2("The ledger: what you're actually trading"),
      p("Every “should I use a BaaS” argument I've watched eventually lands on four lines of a ledger. Here they are, without the adjectives."),
      h3("Control"),
      p("Self-hosting, you can install any Postgres extension, tune any setting, and read any log at full resolution. On a BaaS you get whatever the dashboard exposes, and support tickets for the rest. Supabase scores unusually well on this line because it's standard Postgres underneath — pg_dump works, the schema is portable SQL, and a long list of extensions is available. Firebase sits at the other end: Firestore's data model and query semantics exist nowhere else."),
      h3("Lock-in surface"),
      p("Lock-in isn't a yes/no property; it's a surface area. The useful question: if we left in a year, what would we rewrite? Leaving Supabase, you'd rewrite the auth integration and whatever leans on the client SDK — the data itself comes with you as plain SQL. Leaving Firebase means rebuilding your data layer and translating a document model into whatever comes next, which is why so few teams ever do it. Neither is doom. Both should be priced in before you commit, not after."),
      h3("Pricing predictability"),
      p("A rented server costs the same whether it's busy or idle: boring, predictable, and you pay full price through the idle months too. Usage-based pricing starts near zero and grows with success, which sounds fair right up until a traffic spike — or a runaway loop you wrote yourself — meters up a real bill. My rule: BaaS bills are more predictable than skeptics claim and less predictable than pricing pages imply. Set a spending cap or alert the same day you add a card."),
      h3("Time"),
      p("The weeks of plumbing you skip are real weeks. For a solo developer or a two-person team, this line usually decides the whole ledger, and there's no shame in that — time spent reimplementing password reset is time not spent on the product someone might actually pay for."),
      callout("tip", "Deeper: free tiers deserve a ledger line of their own. Supabase's free tier pauses projects after about a week of inactivity — fine for a demo, mortifying for the portfolio project a recruiter opens in week three. Treat “what happens at the tier boundary” as a research question before you build, not a surprise after."),

      h2("Where the abstraction leaks"),
      p("Every abstraction leaks somewhere. These are the three places that actually bite on Supabase-style platforms — not deal-breakers, but the difference between seeing it coming and debugging it at midnight."),
      h3("Connection pooling"),
      p("Postgres was designed for a modest number of long-lived connections. Serverless platforms produce the opposite: hundreds of short-lived ones, each function invocation wanting its own. That mismatch is why Supabase puts a connection pooler in front of your database and hands you two different connection strings — a direct one and a pooled one — and why picking the wrong one works fine in development and falls over under real traffic."),
      callout("warning", "Deeper: pooling in transaction mode returns your connection to the pool after every transaction, which silently breaks anything that assumes session state — prepared statements, SET commands, advisory locks. ORMs cope if you configure them: Prisma, for example, wants the pooled URL for queries and the direct URL for migrations. If you ever hit “prepared statement does not exist” errors in production, you've found this exact leak."),
      h3("Debugging row-level security"),
      p("RLS fails closed and fails silently. A select blocked by policy doesn't throw an error — it returns an empty array, indistinguishable from “no rows yet.” At least once, you will spend an evening hunting a “missing” row that sat in the table the whole time, visible in the dashboard, invisible to your app. It's the right default for security and a genuinely disorienting one for debugging."),
      callout("tip", "Deeper: debug policies from inside the database, not from the client. Supabase's SQL editor can run queries while impersonating a role or a specific user — reproduce the exact select your app makes as the authenticated role and watch which policy filters it out. Guessing from the client multiplies the variables; impersonation isolates the one that matters."),
      h3("Cold starts on edge functions"),
      p("A serverless function that hasn't run recently starts “cold”: the platform has to spin up an instance before your code executes, and the unlucky first request pays that latency. For our lead-form email, nobody notices. For anything on the interactive path — search suggestions, checkout steps — it's felt. The fix is usually architectural (keep hot paths out of rarely-called functions), not a toggle."),
      callout("info", "Deeper: cold-start time scales with what your function loads before doing any work — big dependencies and eager top-level initialization are the usual weight. Keep functions small and single-purpose, and import a heavy client lazily inside the handler when only one branch needs it; the cold path shrinks from noticeable to negligible."),

      h2("Who should skip a BaaS entirely"),
      p("The fair answer to “should I use one?” is “probably, for the kind of app it's built for.” But some people should genuinely close the tab:"),
      ...bullet([
        "You're learning backend development. Build the Express version at least once — you'll use a BaaS better afterwards because you'll know exactly what it's saving you, and debug it better because you'll recognize the Postgres underneath.",
        "The backend is your product. Heavy background processing, long-running jobs, unusual protocols, tight latency budgets: the generic 80% was never your bottleneck, and the platform mostly constrains your special 20%.",
        "You have hard compliance or data-residency requirements. If the sentence “it must run inside our infrastructure” appears anywhere in your constraints, the managed conversation is over before pricing comes up.",
        "You already operate infrastructure well. If Postgres, deploys, and monitoring are a solved routine on your team, a BaaS solves a problem you don't have and adds a vendor you didn't need.",
      ]),
      p("Everyone else — the CRUD app, the SaaS dashboard, the side project that needs auth and a database by Sunday night — is the target market, and for that market the product mostly delivers what it promises."),
      p("So, my skeptic-to-skeptic summary: BaaS is real, the weeks it saves are real, and the things it can't do for you are precisely the things that were never going to be outsourced anyway — your data model, your authorization rules, your logic, your bill. Suspicion of the marketing was correct. Suspicion of the whole category costs you more than it protects."),

      h2("Where to go from here"),
      p("The fastest way to test the tradeoff is to feel it: pick the piece of backend you least want to hand-build and let a platform carry it once."),
      richP("For most projects that piece is auth, and ", link("Supabase authentication: the complete guide with Next.js", "/blog/supabase-authentication-complete-guide-with-next-js"), " walks the whole flow end to end. And if this article talked you out of the category — a perfectly good outcome — ", link("PostgreSQL for web developers", "/blog/postgresql-for-web-developers-a-practical-guide"), " is the foundation you'll be standing on either way, managed or not."),
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // C8-1 · CI/CD with GitHub Actions: a Pipeline You Can Actually Read
  // ───────────────────────────────────────────────────────────────────────
  {
    title: "CI/CD with GitHub Actions: a Pipeline You Can Actually Read",
    excerpt:
      "Most Actions tutorials leave you with YAML nobody can explain six months later. Build a Node.js pipeline line by line — triggers, caching, ordering, secrets — and know why every line exists.",
    categoryName: "DevOps & Infrastructure",
    tagNames: ["Git & GitHub", "Docker"],
    difficulty: "beginner",
    seoTitle: "GitHub Actions CI/CD for Node.js: a Pipeline You Can Read",
    seoDescription:
      "A GitHub Actions CI/CD tutorial for Node.js that earns every line: triggers, caching, job order, secrets, and branch protection that makes green count.",
    publishDate: "2026-08-05",
    readingTime: 10,
    imageUrl: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1400&q=80",
    imageAlt: "Open laptop on a desk showing lines of code in a dark editor window",
    content: [
      p("Six months from now, someone opens .github/workflows/ci.yml in your repository, scrolls through two hundred lines of YAML, and quietly closes the tab. There's a step named “Fix permissions (temporary)” from last spring. There's continue-on-error: true on the test job, added during a deadline week nobody wants to relive. Three different steps install dependencies three different ways. The badge says passing, and not one person on the team can say precisely what it proves."),
      p("That someone is usually you. Copy-pasted pipelines rot because nobody understands them well enough to prune them — and the cure isn't a cleverer pipeline, it's a legible one. So let's build CI for a Node.js + TypeScript project line by line, in the order the lines earn their place, with the reasoning attached to each. By the end, green will mean something again."),
      richP(bold("What you'll walk away with:"), " a working pipeline and, more importantly, its reasoning."),
      ...bullet([
        "A complete GitHub Actions workflow for a Node 22 + TypeScript project — under forty lines, each one justified",
        "Why lint → typecheck → test → build is the right order (economics, not convention)",
        "What the npm cache actually caches, where secrets belong, and how branch protection turns green into a gate",
        "The three smells that tell you a pipeline is lying",
      ]),

      h2("CI and CD, in two breaths"),
      p("Continuous Integration (CI) is the practice of merging small changes often and verifying each one automatically — linting, types, tests, a build — so a mistake surfaces minutes after it's written instead of weeks later inside someone else's rebase. Continuous Delivery (CD) is the follow-through: changes that pass the checks get shipped by machinery, not by a person with a checklist and a prayer. This article builds the CI half properly; the smells section shows where CD bolts on without contaminating it."),
      p("GitHub Actions vocabulary, once, so the YAML reads like language: a workflow is a file in .github/workflows/ that runs in response to events. A workflow contains jobs; every job gets a fresh virtual machine called a runner. A job is a list of steps — either shell commands (run:) or reusable published components called actions (uses:). “Fresh machine” is the load-bearing phrase. Nothing survives between runs, which is precisely the point: your laptop accumulates state, while the runner proves the project stands up from zero."),

      h2("Start with the triggers, not the steps"),
      p("Create the file, and decide when it runs before deciding what it runs:"),
      code("yaml", `name: CI

on:
  push:
    branches: [main]
  pull_request:`, ".github/workflows/ci.yml"),
      p("Two triggers, two different questions. pull_request runs on every update to an open PR — and, the part most tutorials skip, it checks out a preview of the merge result, not your branch as-is. It answers: “would main still be green if this merged right now?” The push trigger, filtered to main, answers the other question: “is main actually green at this commit?” You want both, because two pull requests can each pass alone and still break main in combination once both land."),
      p("The branches filter on push isn't decoration either. Without it, every push to a PR branch runs the workflow twice — once as push, once as pull_request — and you pay double for identical information."),
      callout("info", "Deeper: technically, pull_request builds a temporary merge commit of your branch into the base branch and tests that. If your branch is stale, CI is verifying a merge that hasn't happened yet — a feature, not a bug. Pair it with branch protection's “require branches to be up to date” (below) and the loophole of two independently green but conflicting PRs closes too."),

      h2("A runner with your Node on it"),
      p("Now the job skeleton — get a machine, get the code, get the right Node, install honestly:"),
      code("yaml", `jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install dependencies
        run: npm ci`, ".github/workflows/ci.yml"),
      ...bulletRich([
        [inlineCode("runs-on: ubuntu-latest"), " — the machine image. Linux is the default choice: quickest to start, and the cheapest minutes if your repository is private and metered."],
        [inlineCode("actions/checkout@v4"), " — clones the repository into the runner. Nothing here is implicit: skip it and the machine is empty."],
        [inlineCode("actions/setup-node@v4"), " with ", inlineCode("node-version: 22"), " — installs the Node you actually develop and deploy on. Pinning the major version is how “works locally, fails in CI” stops being a version lottery."],
        [inlineCode("cache: \"npm\""), " — restores npm's download cache between runs, keyed on your lockfile. The first run downloads the world; later runs mostly don't."],
        [inlineCode("npm ci"), " — deliberately not npm install. The ci in the name means clean install: it removes node_modules, installs exactly what package-lock.json says, and fails loudly if the lockfile and package.json disagree. Reproducibility is CI's entire job description, and this is the command that takes it seriously."],
      ]),
      callout("tip", "Deeper: setup-node's cache option stores npm's global download cache (~/.npm), not node_modules itself. That's deliberate — node_modules is enormous, platform-entangled, and frequently slower to restore than to rebuild from cached tarballs. If you're tempted to cache node_modules directly, measure both ways first; it's a classic negative-savings optimization."),

      h2("The checks, ordered by cost"),
      p("Now the pipeline earns its keep. The order below isn't tradition — it's fail-fast economics: run the cheapest, most-likely-to-fail checks first, so a broken run dies in seconds instead of after the full bill:"),
      code("yaml", `      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npx tsc --noEmit

      - name: Test
        run: npm test

      - name: Build
        run: npm run build`, ".github/workflows/ci.yml"),
      p("Lint finishes in seconds and catches the mechanical mistakes. The typecheck — tsc --noEmit means “check the types, emit no files”; your bundler does the emitting — is nearly as fast and catches a far deeper class of bug. Tests cost more, so they run third. The production build is usually slowest and fails most rarely, so it anchors the end. Steps in a job run sequentially and stop at the first failure, which means the expensive stages never run for code that can't pass the cheap ones."),
      p("Should these be parallel jobs instead? Remember that each parallel job is a fresh runner paying its own checkout and npm ci before doing anything useful. For most projects, this sequence finishes before a fan-out would finish installing. Split a stage into its own job when it's genuinely slow — a half-hour end-to-end suite, say — not because the diagram looks more professional with boxes."),

      h2("Secrets and vars: two drawers, not one"),
      p("Sooner or later a step needs credentials — a token for uploading source maps, a key for a private registry. GitHub gives each repository two storage drawers under Settings → Secrets and variables → Actions, and the split matters. Secrets are encrypted, masked in logs (they print as ***), and meant for anything that grants access. Variables are plain configuration you'd happily see in a log: a public site URL, a feature flag."),
      code("yaml", `      - name: Build
        run: npm run build
        env:
          SENTRY_AUTH_TOKEN: \${{ secrets.SENTRY_AUTH_TOKEN }}
          NEXT_PUBLIC_SITE_URL: \${{ vars.SITE_URL }}`, ".github/workflows/ci.yml"),
      p("Two habits keep this boring. Hand a secret to the narrowest step that needs it — env: on the step, not on the workflow. And never print one: masking matches exact strings, so a secret that's been base64-encoded or embedded into a URL sails into the log unmasked."),
      callout("warning", "Deeper: pull requests opened from forks do not receive your secrets — if they did, anyone on the internet could open a PR whose workflow exfiltrates them. Design the default checks to pass without secrets, or outside contributors will live with permanently red CI through no fault of their own."),

      h2("Branch protection: making green load-bearing"),
      p("Everything so far is advisory. The workflow runs, reports, and anyone can merge a red pull request anyway — CI as decoration. The fix lives in repository settings, not YAML: under Settings → Branches (or the newer Rulesets), protect main. Require a pull request before merging; require status checks to pass and select your check job; and — the checkbox everyone skips — require branches to be up to date before merging."),
      p("That last one is what makes the merge-preview honest. A green-but-stale PR must re-run against the current main before it can land, which permanently closes the two-green-PRs-that-conflict gap. The cost is extra CI runs on a busy repository; the purchase is that green stops meaning “was fine last Tuesday” and starts meaning “is safe to merge right now.”"),

      h2("Cancel the runs nobody is waiting for"),
      p("One more block earns its place even in a small pipeline. Push three commits to a PR in quick succession and you've queued three full runs — two of them verifying code that no longer exists:"),
      code("yaml", `concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}`, ".github/workflows/ci.yml"),
      p("Runs are grouped per workflow and branch, and a new run cancels the in-flight one from its own group. The expression on cancel-in-progress exempts main: pull-request runs are disposable drafts, but every commit that reaches main should be verified in full, with no skipped generations."),
      callout("info", "Deeper: on matrix builds — strategy.matrix runs the same job across combinations (Node 20, 22, and 24; three operating systems; and so on). For a published library, that's exactly right: the matrix is the compatibility promise you make to strangers. For an application deployed to one known runtime, a matrix is waste with a professional haircut — triple the minutes and triple the flake surface, verifying platforms you will never run. Add one only when it checks a promise you're actually making."),

      h2("The whole file, assembled"),
      code("yaml", `name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npx tsc --noEmit

      - name: Test
        run: npm test

      - name: Build
        run: npm run build`, ".github/workflows/ci.yml"),
      p("Thirty-nine lines, one job, five commands — the same five you can run in your own terminal, in the same order. That symmetry is worth protecting: when CI and your terminal agree on what “checked” means, red becomes information instead of ritual. One block you haven't met yet: permissions: contents: read strips the workflow's default GitHub token down to read-only, and the small print below explains why that's the cheapest security line in the file. The secrets example from earlier isn't here either — add that env block the day a step actually needs a credential, not before."),
      p("When someone proposes a new step, hold it to the standard the file has set: will the next reader know what this is for? YAML comments are free. Use them the moment the answer is no."),

      h2("Three smells of a lying pipeline"),
      p("Legibility doesn't decay randomly — it decays through specific, recognizable moves. These three account for most of it."),
      h3("Smell one: continue-on-error as a coping mechanism"),
      p("continue-on-error: true tells Actions to run a step and disregard its failure. It has a handful of honest uses — an experimental canary check, a best-effort metrics upload. As a response to a failing required check, it's poison on a delay: the step still renders red, the run passes anyway, and the team spends the next quarter learning that red is background noise. The day a real failure scrolls past in that noise, the pipeline has negative value — it costs minutes and provides cover. If a check isn't worth blocking on, fix it or delete it. There is no stable third state."),
      h3("Smell two: the monolithic mega-job"),
      p("The opposite failure from over-splitting: one job that lints, tests, builds, assembles a Docker image, pushes it, deploys to staging, and posts to chat — grown one “just add it here” at a time. Now verification and delivery are welded together. You can't check a branch without half-shipping it, a flaky chat notification fails “CI,” and a failure at minute twelve re-runs everything from minute zero. The clean cut is by purpose: verification (this article's file) in one workflow, delivery in another that depends on it — gated to main, holding the deploy credentials, small enough to audit. Verification runs everywhere; delivery runs in exactly one place."),
      h3("Smell three: it only really works on main"),
      p("This one grows quietly: a check that needs a secret PRs can't access, an if: github.ref == 'refs/heads/main' guard multiplied until pull-request runs verify a hollow subset, a Docker build that only happens post-merge. The badge is green on every PR because the PR barely checks anything — the first honest test of your change is the merge itself, which is precisely what CI exists to prevent. Audit it occasionally: open a PR that deliberately breaks something real and confirm the pipeline catches it before merge. If it can't, your pull_request trigger is scenery."),

      h2("Small print that bites exactly once"),
      ...bulletRich([
        [inlineCode("npm ci"), " fails on a lockfile that disagrees with package.json — that's the tool doing its job, not obstruction. Run npm install locally, commit the updated lockfile, and treat the red as the useful signal it was."],
        [bold("ubuntu-latest is a moving target."), " When GitHub re-points it at a new Ubuntu release, preinstalled system tools change underneath you. Your Node is pinned; the OS around it isn't — rare, but worth remembering the week CI breaks and you changed nothing."],
        [bold("The permissions block is your blast radius."), " Everything that runs during npm ci and the build — including any compromised dependency's install script — can reach the job's GitHub token. permissions: contents: read makes that token read-only. Least privilege in two lines."],
        [bold("Version tags are mutable."), " actions/checkout@v4 is a tag its author can move. For GitHub's own actions that's an acceptable bargain; for third-party actions, pin the full commit SHA — a tag can be re-pointed at malicious code, a SHA can't."],
      ]),

      h2("Where to go from here"),
      p("Wire this file into a repository, protect main, and let it run for a week — legibility is a property you maintain, not a milestone you pass once."),
      richP("The branching side of the story — what should trigger CI, and how work should flow into main — is covered in ", link("Git workflow strategies for development teams", "/blog/git-workflow-strategies-for-development-teams"), ". The delivery side starts with packaging the app identically everywhere, which is ", link("Docker for frontend developers: a practical introduction", "/blog/docker-for-frontend-developers-a-practical-introduction"), " — the natural first step toward the CD workflow this pipeline deliberately left out."),
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // C9-1 · Your First Deploy: From Localhost to a Real URL, Step by Step
  // ───────────────────────────────────────────────────────────────────────
  {
    title: "Your First Deploy: From Localhost to a Real URL, Step by Step",
    excerpt:
      "Your app runs on localhost and nowhere else. Here's what deploying actually means, which hosting path fits your project, and the exact route from git push to a URL you can send to a friend.",
    categoryName: "Cloud & Hosting",
    tagNames: ["Vercel", "Git & GitHub"],
    difficulty: "beginner",
    seoTitle: "How to Deploy a Website for the First Time (Step by Step)",
    seoDescription:
      "How to deploy a website for the first time: what deploying is, pushing to GitHub, importing to Vercel, environment variables, domains, and reading the logs.",
    publishDate: "2026-08-07",
    readingTime: 10,
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80",
    imageAlt: "Hands typing on a laptop showing analytics graphs, with a phone and notebook on the white desk",
    content: [
      p("Your project works. You know it works because it's open in the browser right now — http://localhost:3000, an address your fingers type on their own. Then a friend asks the completely reasonable question: “nice, send me the link.” And there is no link. There has never been a link. The only person on Earth who can see your app is you, and only until you close the laptop."),
      p("Every developer hits this wall, and it feels taller than it is because “deployment” sounds like a job title rather than an afternoon's work. Here's the honest secret: putting a modern web app on a real URL is mostly a git push and some careful clicking — provided you understand a handful of ideas well enough to fix things when they wobble. Those ideas, not the clicking, are what this walkthrough is really about."),
      richP(bold("What you'll walk away with:"), " a live URL, and the mental model behind it."),
      ...bullet([
        "A plain-words picture of what deploying actually is — one always-on computer and a name that points at it",
        "The three modern hosting paths and which one fits your project",
        "The full route: GitHub → Vercel → environment variables → your own domain",
        "How to recognize and fix the four errors that break almost every first deploy",
      ]),

      h2("What deploying actually is"),
      p("Strip the vocabulary away and deploying is two things. First: your code runs on a computer that isn't yours — a server, which is nothing more exotic than a computer that is always on, always connected, and configured to answer requests from strangers. Second: a name, like yourapp.com, points at that computer so browsers can find it. That's the entire trick. Everything else in the hosting universe — CDNs, containers, serverless — is optimization layered over those two facts."),
      p("Decode your own address bar and the wall shrinks further. localhost is a special name that always means “this machine”; 3000 is a port, a numbered door on it. That's why the link works for you and nobody else — everyone's localhost points at their own computer. One more gap worth naming: locally you run a development server, optimized for instant reloads and helpful errors. A deployment runs your production build — the compiled, minified output of npm run build. Same project, different costume, occasionally different behavior, which is why reading build logs is a skill we'll pick up along the way."),

      h2("Three ways onto the internet"),
      p("Almost every hosting option is a variation on one of three paths, and choosing the right one up front prevents most first-deploy misery."),
      h3("Static hosting: just files"),
      p("If your project compiles down to HTML, CSS, and browser JavaScript with no server code of its own — a portfolio, documentation, a browser game — then deploying means copying files onto a host that serves them unchanged. GitHub Pages, Cloudflare Pages, and friends do this free and nearly unbreakably; there's no server process to crash at 3 a.m. Not sure whether you have server code? Ask: does anything need a secret the visitor must never see, or a database? If yes, keep reading."),
      h3("A platform that runs your code (probably you)"),
      p("The middle path — Vercel, Netlify, Railway, Render — is a platform you connect to your Git repository. On every push it builds the project, runs it on managed infrastructure, and serves it at a URL; your server code executes without you administering a server. If you're deploying a Next.js app, or anything with a build step and API routes, for the first time, this is your path — and it's the one this walkthrough follows, using Vercel. My bias, declared: it's where my own projects run, and for Next.js the defaults line up with zero configuration."),
      h3("A rented server: the VPS"),
      p("The third path is renting a virtual machine — a VPS — and doing everything yourself: install Node, configure a web server, obtain TLS certificates, apply security updates, forever. Full control, full responsibility. It's a genuinely good path to learn eventually, because it demystifies every layer the platforms hide. It is a punishing first deploy. Learn it second."),

      h2("The walkthrough: localhost to live"),
      p("Five steps, none of them mysterious:"),
      ...numbered([
        "Push the project to GitHub",
        "Import the repository into Vercel",
        "Recreate your environment variables — the step that breaks most first deploys",
        "Point a real domain at it",
        "Verify it, and know how to roll it back",
      ]),
      h3("Step 1: get the code on GitHub"),
      p("Platforms deploy from a Git repository: you push, they react. If your project isn't on GitHub yet, this is the whole ceremony — create an empty repository on github.com first, then:"),
      code("bash", `git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOURNAME/your-app.git
git push -u origin main`, "terminal"),
      p("One inspection before that git add . — your .gitignore must exclude two things. node_modules, because it's enormous and rebuildable from package.json. And every .env file, because those hold secrets, and public repositories are scanned continuously by bots hunting for leaked keys. A committed secret is a compromised secret even if you delete it a minute later; git history remembers."),
      code("text", `node_modules/
.env
.env*.local
.next/`, ".gitignore"),
      h3("Step 2: import the project into Vercel"),
      p("Sign up at vercel.com with your GitHub account — the two need to talk to each other, so this saves a configuration dance. From the dashboard: Add New → Project, and pick your repository from the list. Vercel inspects it and, for a recognized framework — Next.js, Vite, Astro, plain static — pre-fills the build command and output directory. For a standard project you change nothing on this screen. Click Deploy."),
      p("Now watch your first build log stream by: dependencies installing, npm run build compiling, files uploading. A couple of minutes later — confetti and a URL, something like your-app.vercel.app. That URL is real, public, and shareable. Send it to the friend. If the build failed instead, don't refresh in despair: jump to the breakage section below, where the first two errors cover nearly every first-build failure."),
      h3("Step 3: environment variables, or why it broke anyway"),
      p("Here's where most first deploys actually die — the build succeeded, and the site greets you with a blank page or a 500. Locally, your app reads configuration and secrets from .env.local: database URLs, API keys. That file is gitignored on purpose, so it never reached GitHub — so Vercel has never heard of it. On the server, your code reads those variables, gets undefined, and falls over."),
      p("The fix is deliberate re-entry: Project → Settings → Environment Variables, and recreate each key your app reads. But — the second trap, nested inside the first — with production values, not copies of your local ones. Your local file is full of addresses that only mean something on your machine:"),
      code("text", `# .env.local — values that only work on YOUR machine
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapp
NEXT_PUBLIC_API_URL=http://localhost:3000`, ".env.local"),
      p("On a server, localhost means the server itself — where your laptop's database conspicuously isn't. Every localhost value needs a production counterpart: a hosted database's connection string, your real deployed URL. The same landmine hides in code, wherever a URL got hardcoded during development:"),
      code("ts", `// Breaks after deploy: "localhost" is whatever machine runs the code
const broken = await fetch("http://localhost:3000/api/products");

// Works everywhere the app is served: a same-origin relative path
const works = await fetch("/api/products");`, "lib/products.ts"),
      callout("warning", "Deeper: environment variables split into build-time and runtime, and the split explains two classic mysteries. Anything prefixed NEXT_PUBLIC_ (or VITE_) is inlined into the JavaScript bundle while building — visible to anyone in DevTools, so never a secret — and frozen at that moment: changing it later does nothing until you rebuild. Server-only variables are read live at request time. “I updated the variable and nothing changed” is almost always a build-time variable waiting for its redeploy."),
      h3("Step 4: a domain of your own"),
      p("your-app.vercel.app is perfectly shareable, but a portfolio gains something real from a name you chose. Buy one at any registrar — a .com typically runs ten to twenty dollars a year — then, in Vercel: Project → Settings → Domains, add yourapp.com, and the dashboard shows the exact DNS records to create at your registrar."),
      p("DNS in plain words: the internet's phone book, mapping the names humans type to the addresses machines route to. You'll meet two record types. An A record points a name directly at a server's numeric IP address — used for the bare “apex” domain, yourapp.com. A CNAME record points a name at another name — typically www.yourapp.com at a hostname Vercel provides, which lets them reshuffle servers without you ever touching the entry again. Copy the values from the Vercel screen into your registrar's DNS panel exactly as shown."),
      p("Then wait, on purpose. DNS answers are cached all over the internet, each for a duration called the TTL (time to live), so new records reach the world over minutes to a few hours. A domain that doesn't resolve right after you saved the records usually isn't broken — it's caching. HTTPS, meanwhile, is the modern era's free gift: once the records check out, the certificate is provisioned and renewed automatically. That used to be an afternoon of a sysadmin's time; now it's a checkmark you watch turn green."),
      h3("Step 5: verify like a stranger, roll back like a pro"),
      p("A green deploy isn't a verified deploy. Open the live site the way a stranger would — a private window, a hard refresh — and click the real paths: the form, the login, the page that talks to the database, with the browser console open for red. Then learn where the two logs live, because every future symptom sorts into one of them. Build Logs record what happened while compiling — home of “works locally, fails to deploy.” Runtime (function) logs record what your server code printed while answering real requests — home of “deployed fine, breaks when clicked.”"),
      p("And the safety net that changes your relationship with shipping: on Vercel, every deployment is kept, immutable, and production is essentially a pointer at one of them. Ship something broken and rolling back means re-pointing at the previous deployment — seconds, no rebuild, no git archaeology at midnight. First deploys feel like one-way doors. They aren't, and knowing that is what lets you ship the second one without ceremony."),
      callout("tip", "Deeper: the feature that quietly changes how you work is preview deployments. With the Git integration in place, every branch and pull request automatically gets its own complete deployment at its own URL — your work-in-progress, live and clickable, without touching production. Feedback changes character when you send a URL instead of a screenshot. Teams assemble whole toolchains to get this; on a platform it's the default behavior."),

      h2("When your deploy breaks: the four classics"),
      p("Sooner rather than later, a deploy will fail, and it will almost certainly fail in one of four ways. The skill isn't avoiding them — it's matching the symptom to the cause, and knowing which log to read."),
      h3("1. “Module not found” — but it runs locally"),
      p("The build log stops at an import your editor resolves without complaint. Two usual suspects. First, case sensitivity: macOS and Windows filesystems typically treat Button.tsx and button.tsx as the same file; the Linux build machine does not. An import whose casing drifted from the filename works locally for years and dies on the first deploy. Second, a phantom dependency: a package that exists in your node_modules but was never recorded in package.json — installed once, never saved. The honest test for both is a fresh clone in an empty folder: npm ci && npm run build tells you the truth your laptop has been politely hiding."),
      h3("2. Builds fine, then a blank page or a 500"),
      p("The deploy succeeded; the site doesn't work. Overwhelmingly, this is Step 3 left incomplete: a missing environment variable. Locally .env.local filled it; in production nothing did, and the crash shows up in the function logs as a database client refusing to connect, or an undefined where a key belonged. Compare the keys in .env.local against the dashboard list — line by line, boringly — add what's missing, and redeploy, remembering that build-time variables need that rebuild to take effect."),
      h3("3. The frontend can't reach the API"),
      p("The page renders, but data never arrives. Open the network tab: requests going to localhost:3000, or some other address that only exists on your machine, and failing. The hardcoded-URL landmine from Step 3 has gone off — relative URLs fix the same-origin case, and an environment variable holds the base URL when the API genuinely lives elsewhere. Its cousin wears a different uniform: “blocked by CORS policy” in the console means the frontend and the API live on different origins and the server isn't listing yours as allowed. That's a server-side setting — it is never fixable from the fetch call, however hard the error message stares at your frontend."),
      h3("4. The domain shows nothing, or somebody else's page"),
      p("The .vercel.app URL works; yourapp.com times out, warns about certificates, or shows a registrar's parking page. This is DNS, and it's almost always one of four small things: a mistyped record value, an A record where a CNAME was requested (or vice versa), the record attached at the wrong level — @ versus www — or records that are correct and simply still propagating. Check the Domains panel in Vercel first: it validates each record and tells you which one it's unhappy with. Give the TTL its time before re-editing anything; churning half-propagated records only resets the waiting."),

      h2("Where to go from here"),
      p("Here's the quiet payoff nobody mentions: the second deploy is just git push. The wall you spent this article climbing doesn't re-form behind you — from now on, shipping is a side effect of committing."),
      richP("When you're ready for the deeper end of this exact path — build configuration, serverless function limits, previews on a team — ", link("Deploying full-stack apps to Vercel: the definitive guide", "/blog/deploying-full-stack-apps-to-vercel-the-definitive-guide"), " continues where this walkthrough stops. And once deploys feel routine, the next upgrade is making a robot check your work before every ship: that's ", link("CI/CD with GitHub Actions: a pipeline you can actually read", "/blog/ci-cd-with-github-actions-a-pipeline-you-can-actually-read"), "."),
    ],
  },
];

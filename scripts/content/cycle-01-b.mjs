/**
 * Content wave — cycle 1, part B (docs/CONTENT-PLAN.md batch 1).
 * Briefs C4-1 (Backend Technologies), C5-1 (Databases), C6-1 (APIs & Integrations).
 */
import { p, h2, h3, code, callout, bold, inlineCode, link, richP, bullet, bulletRich, numbered } from "./pt.mjs";

export const posts = [
  // ── C4-1 · Backend Technologies · 2026-07-27 ────────────────────────────
  {
    title: "Getting Started with Node.js in 2026: the Parts That Matter",
    excerpt:
      "Most Node tutorials still teach 2016. What actually matters in 2026: the runtime itself, the built-ins that replaced npm staples, and a first HTTP server you fully understand.",
    categoryName: "Backend Technologies",
    tagNames: ["Node.js", "TypeScript"],
    difficulty: "beginner",
    seoTitle: "Getting Started with Node.js: a 2026 Backend Guide",
    seoDescription:
      "A practical guide to getting started with Node.js backend work in 2026: what a Node process is, the built-ins that replaced npm staples, and your first server.",
    publishDate: "2026-07-27",
    readingTime: 10,
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1400&q=80",
    imageAlt: "Colorful lines of code on a laptop screen in a dark editor theme",
    content: [
      p("It is 11 pm. You know JavaScript from the browser, you have decided tonight is the night you learn the backend, and the top tutorial for getting started with Node.js opens with var express = require('express') and an npm install of body-parser. The comments underneath are from 2017. The second result wants a scaffolding tool that was archived years ago."),
      p("Node.js has been around since 2009, which means over fifteen years of tutorials are still ranking — and most of them teach workarounds for problems Node has since solved. I see the damage regularly: new backend developers installing packages the runtime now ships, wiring up build steps nobody needs, and reaching for a framework before they can say what it does. This is the guide I wish they were finding instead."),
      richP(bold("What you'll walk away with:"), " a working setup and, more importantly, a mental model:"),
      ...bullet([
        "What a Node.js process actually is, and why 'single-threaded' is less scary than it sounds",
        "The Node 22 built-ins that replaced fetch libraries, dotenv, nodemon, and a test framework",
        "One HTTP endpoint written twice — with zero dependencies and with Express 5 — so you can see exactly what the framework adds",
        "Project hygiene from day one: scripts, TypeScript via tsx, and environment variables that fail loudly",
      ]),

      h2("What a Node.js process actually is"),
      p("Node.js is a program that runs JavaScript outside the browser. It bundles V8 — the same engine Chrome uses to execute JavaScript — with libuv, a library that talks to the operating system about things browsers never let you touch: files, network ports, child processes. When you type node app.js, the operating system starts one process (a running instance of a program) that reads your file and executes it top to bottom."),
      p("The part that confuses people is what happens after the last line. Try this:"),
      code("js", `console.log("starting, pid", process.pid);

setTimeout(() => {
  console.log("two seconds later, same process");
}, 2000);

console.log("reached the end of the file");`, "hello.js"),
      p("Run node hello.js. The first and third lines print immediately; the process then sits for two seconds, prints the middle line, and exits. Nothing 'waited' on the setTimeout line — Node registered the timer, ran to the end of the file, and kept the process alive because work was still pending. The machinery that tracks pending work and runs your callbacks when it completes is called the event loop."),
      p("That is the entire trick behind Node as a backend. A server is just a process that registers a callback for 'a request arrived', and one process can juggle thousands of simultaneous connections — because at any moment most of them are waiting on a database, a disk, or a network, and waiting costs the event loop nothing. Your JavaScript runs on a single thread; the waiting is delegated to the operating system."),

      h2("The built-ins that replaced half of npm"),
      p("This is where outdated tutorials do the most damage, because every one of them makes you install something Node 22 already ships. Before your first npm install (npm being Node's package manager), know what is in the box."),
      h3("fetch is global"),
      code("js", `const res = await fetch("https://api.github.com/repos/nodejs/node");
if (!res.ok) throw new Error(\`GitHub answered \${res.status}\`);

const repo = await res.json();
console.log(repo.full_name, "has", repo.open_issues_count, "open issues");`, "issues.mjs"),
      p("The same fetch you know from the browser, available on the server without installing anything. No node-fetch, no axios for everyday calls. The await at the top of the file works because the .mjs extension marks this as an ES module — hold that thought for a minute."),
      h3("A test runner is included"),
      code("js", `import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify } from "./slugify.mjs";

test("slugify flattens case and spaces", () => {
  assert.equal(slugify("Hello Node World"), "hello-node-world");
});`, "slugify.test.mjs"),
      p("node --test finds and runs these. You may still choose Vitest later for its watch UI and richer mocking, but a project can now ship real tests with zero test dependencies — which removes the last excuse for shipping none."),
      h3("Watch mode and .env files"),
      code("bash", `node --watch server.mjs           # restart on change: nodemon's old job
node --env-file=.env server.mjs   # load .env into process.env: dotenv's old job
node --watch --env-file=.env server.mjs   # both at once`, "terminal"),
      p("An .env file holds environment variables — key=value settings such as ports and database URLs that live outside your code so they can differ between your laptop and production. Node reads the file natively now; we will add validation on top shortly."),
      callout("info", "Deeper: the ESM/CJS split in 2026. Node has two module systems: CommonJS (require, module.exports) and ES modules (import, export). Write new code as ESM — name files .mjs, or set \"type\": \"module\" in package.json so plain .js counts. The painful years of the split are mostly behind us: current Node 22 releases can even require() an ES module as long as its module graph is synchronous, so the two worlds finally interoperate in both directions. You will still meet require() in older tutorials; translate it to import rather than mixing styles in one project."),

      h2("An HTTP server with zero dependencies"),
      p("Most guides reach for Express in the first paragraph. I want you to build the raw version first — not because you will ship it, but because Express is a thin layer, and once you have routed a request by hand you will never again wonder what the framework is doing."),
      p("An HTTP server is a program that listens on a port, receives requests — a method like GET or POST, a URL, headers, sometimes a body — and writes back responses: a status code, headers, a body. Node's built-in node:http module hands you exactly that and nothing more:"),
      code("js", `import { createServer } from "node:http";

const users = [
  { id: 1, name: "Ana" },
  { id: 2, name: "Boris" },
];

const server = createServer((req, res) => {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);

  if (req.method === "GET" && url.pathname === "/users") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(users));
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/users/")) {
    const id = Number(url.pathname.slice("/users/".length));
    const user = users.find((u) => u.id === id);
    if (!user) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "user not found" }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(user));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "no such route" }));
});

server.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});`, "server.mjs"),
      p("Run it with node --watch server.mjs and poke it from a second terminal:"),
      code("bash", `curl http://localhost:3000/users
curl http://localhost:3000/users/2
curl http://localhost:3000/users/9   # {"error":"user not found"}`, "terminal"),
      p("Everything is visible. One function receives every request; you branch on method and path; you write a status, headers, and a body. Now notice what you are already missing. The routing is an if-chain that will not survive twenty endpoints. Reading a POST body means collecting stream chunks by hand. Every response repeats the same three lines. An uncaught exception takes down the whole process. You could build all of that yourself — people did, for years — and what they built is called a framework."),

      h2("The same endpoints in Express 5"),
      code("bash", `npm init -y
npm install express`, "terminal"),
      code("js", `import express from "express";

const app = express();
app.use(express.json()); // parse JSON request bodies onto req.body

const users = [
  { id: 1, name: "Ana" },
  { id: 2, name: "Boris" },
];

app.get("/users", (req, res) => {
  res.json(users);
});

app.get("/users/:id", (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "user not found" });
  res.json(user);
});

app.post("/users", (req, res) => {
  const user = { id: users.length + 1, name: req.body.name };
  users.push(user);
  res.status(201).json(user);
});

app.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});`, "server.mjs"),
      p("Hold the two files side by side and Express stops being magic. The if-chain became declarative routes with named parameters like req.params.id. Body parsing became one line of middleware — middleware being Express's word for functions that run on every request before your handler. res.json() sets the header and serializes in one call. Unmatched routes fall through to a built-in 404. That is the whole pitch: Express is node:http plus a router, a middleware pipeline, and response helpers."),
      p("Express 5 also fixed the sharpest edge in older material: when an async handler throws or a promise rejects, the error is forwarded to Express's error handling automatically. In Express 4 — which is what most pre-2025 tutorials teach — a missing try/catch in an async route could leave a request hanging forever. If a snippet wraps every handler in try/catch just to call next(err), it predates Express 5; the ideas transfer, the boilerplate does not."),
      p("Is Express the only reasonable choice? No — Fastify and Hono are both excellent. But Express is still what you will meet most often in codebases, documentation, and job postings, which makes it the right second step after node:http."),

      h2("Project hygiene from day one"),
      p("The difference between a folder of scripts and a project you can return to in three months is about ten minutes of setup. Three habits are worth forming immediately."),
      h3("Make package.json your control panel"),
      code("json", `{
  "name": "first-backend",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "node --watch --env-file=.env server.mjs",
    "start": "node --env-file=.env server.mjs",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^5.1.0"
  }
}`, "package.json"),
      richP("Setting ", inlineCode("\"type\": \"module\""), " makes plain .js files ES modules, so you can stop thinking about extensions. The scripts block is executable documentation: anyone — including you in October — runs npm run dev without asking how this project starts."),
      h3("TypeScript without a build step"),
      p("You do not need TypeScript to learn Node, but on any project you intend to keep, types catch the req.prams typo while you type it instead of at runtime. The tsx package runs TypeScript directly, so development feels identical to plain JavaScript:"),
      code("bash", `npm install --save-dev typescript tsx @types/node @types/express
npx tsc --init`, "terminal"),
      code("json", `{
  "scripts": {
    "dev": "node --import tsx --watch --env-file=.env src/server.ts",
    "typecheck": "tsc --noEmit",
    "test": "node --test"
  }
}`, "package.json (scripts)"),
      p("One honest caveat: tsx executes your TypeScript but does not type-check it. That is what npm run typecheck is for, and it belongs in CI or a pre-commit hook, not in your memory."),
      callout("tip", "Deeper: Node itself is learning TypeScript. Node 22.6 added --experimental-strip-types, which runs .ts files by erasing the type annotations, and newer release lines have continued down that road. On a Node 22 LTS project I still reach for tsx — it covers more TypeScript syntax and more edge cases — but check node --help before adding tooling; the built-in may already be enough for small scripts."),
      h3("Validate your environment at startup"),
      p("The default failure mode of environment variables is silence: DATABASE_URL is missing in the new deployment, the app boots happily, and the first real request crashes half an hour later with a stack trace that mentions none of this. Treat process.env as untrusted input and validate it once, at boot — Zod is the usual tool:"),
      code("ts", `import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;`, "src/env.ts"),
      p("Import env everywhere instead of touching process.env directly. A misconfigured deployment now dies in one second with a readable list of what is missing, and env.PORT is a number — not a string pretending to be one."),
      callout("info", "Deeper: when worker threads matter. Node's single JavaScript thread handles enormous I/O concurrency, but it computes one thing at a time — a handler that spends two seconds resizing an image or parsing a huge CSV freezes every other request for those two seconds. node:worker_threads exists exactly for this: it moves CPU-heavy work onto separate threads and keeps the loop free. Most CRUD backends never need it, because their slow parts are waiting (database, network), not computing — and libuv already runs file and crypto operations on background threads for you."),

      h2("The gotchas that actually bite beginners"),
      p("A short list, each item earned the annoying way:"),
      ...bulletRich([
        [bold("Blocking the event loop. "), "One slow synchronous operation — sorting a million rows, readFileSync on a big file inside a handler — stalls every connected client at once. Keep per-request work small and asynchronous; push heavy computation to a worker thread or a job queue."],
        [bold("Copying Express 4 answers into Express 5. "), "The framework's major version changed in 2024, and the internet has not caught up. If an answer installs body-parser or wraps every async route in try/catch, it is describing the old world — translate it, don't paste it."],
        [bold("Unhandled promise rejections end the process. "), "Node exits on a rejection nobody caught. That is a good default, but it means one forgotten await plus no error handler equals downtime. Register a final Express error handler, and let your process manager restart you for the truly unexpected."],
        [bold("Version drift between machines. "), "'Works on my laptop' is often two different Node versions. Install through a version manager such as fnm or nvm, commit the version to your repo, and stick to even-numbered releases — those are the ones that receive long-term support (LTS)."],
        [bold("Mixing module systems. "), "If you see 'require is not defined' or 'Cannot use import statement outside a module', you are straddling CommonJS and ESM. Decide once — \"type\": \"module\" — and translate old snippets as you go."],
      ]),

      h2("Where to go from here"),
      richP("Build something small and boring on this foundation — a link shortener, a notes API — before you add a database, so the runtime itself has room to become familiar. When you are ready for real routing, validation, and persistence, ", link("Building REST APIs with Node.js and Express", "/blog/building-rest-apis-with-node-js-and-express"), " picks up exactly where this article stops. And once your handlers are typed, ", link("TypeScript Generics Explained with Real-World Examples", "/blog/typescript-generics-explained-with-real-world-examples"), " will make the utility types in your editor stop looking like hieroglyphs."),
    ],
  },

  // ── C5-1 · Databases · 2026-07-29 ───────────────────────────────────────
  {
    title: "SQL Joins Finally Click: a Visual, Practical Walkthrough",
    excerpt:
      "Two tiny tables, every join walked row by row: where the NULLs come from, which rows silently vanish or duplicate, and the two query patterns behind most real apps.",
    categoryName: "Databases",
    tagNames: ["PostgreSQL", "Prisma & ORMs"],
    difficulty: "beginner",
    seoTitle: "SQL Joins Explained Visually: a Practical Walkthrough",
    seoDescription:
      "SQL joins explained visually: two tiny tables, row-by-row results for INNER, LEFT, RIGHT, and FULL, the NULL traps, and the two patterns real apps use.",
    publishDate: "2026-07-29",
    readingTime: 10,
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1400&q=80",
    imageAlt: "Wall of small wooden drawers in a library card catalog",
    content: [
      p("Picture this: the dashboard you built says the shop has three customers. The users table plainly contains four. Nobody deleted anyone — the dashboard query starts with FROM users JOIN orders, and Boris, who has never ordered anything, silently fell out of the result. Meanwhile finance wants to know why Ana shows up twice in the revenue export."),
      p("Both mysteries are the same misunderstanding, and I partly blame the Venn diagrams. Every joins tutorial draws two overlapping circles, which answer a question nobody is asking — 'which set am I in?' — while hiding the two that matter: which rows multiply, and where the NULLs land. So let's do it the other way around: two tiny tables, real queries against Postgres 16, and the actual output of every join type, printed row by row."),
      richP(bold("What you'll walk away with:"), " a mental model you can replay on any query you meet:"),
      ...bullet([
        "How INNER, LEFT, RIGHT, and FULL joins each decide which rows survive, duplicate, or come back as NULLs",
        "The two join patterns that cover the overwhelming majority of application queries",
        "Why NOT IN can silently return zero rows, and the null-safe habit to replace it",
        "Every example translated to Prisma, so your ORM stops being a black box",
      ]),

      h2("The whole cast: four users, four orders"),
      p("Here is the entire dataset for this article — small enough to hold in your head, which is the point. A users table, an orders table, and a foreign key: orders.user_id stores the id of the user who placed the order. A foreign key is simply a column whose values point at another table's key. This one is nullable, because the shop allows guest checkout — and that single design decision will earn its keep below."),
      code("sql", `CREATE TABLE users (
  id    integer PRIMARY KEY,
  name  text NOT NULL,
  email text NOT NULL
);

CREATE TABLE orders (
  id      integer PRIMARY KEY,
  user_id integer REFERENCES users (id),  -- nullable: guest checkout exists
  total   numeric(6,2) NOT NULL
);

INSERT INTO users VALUES
  (1, 'Ana',   'ana@example.com'),
  (2, 'Boris', 'boris@example.com'),
  (3, 'Chidi', 'chidi@example.com'),
  (4, 'Dana',  'dana@example.com');

INSERT INTO orders VALUES
  (101, 1,    19.90),   -- Ana
  (102, 1,     4.50),   -- Ana again
  (103, 3,    62.00),   -- Chidi
  (104, NULL, 12.00);   -- guest checkout, owned by nobody`, "setup.sql"),
      code("text", ` users                                 orders
 id | name  | email                     id  | user_id | total
----+-------+--------------------      -----+---------+-------
  1 | Ana   | ana@example.com           101 |       1 | 19.90
  2 | Boris | boris@example.com         102 |       1 |  4.50
  3 | Chidi | chidi@example.com         103 |       3 | 62.00
  4 | Dana  | dana@example.com          104 |    NULL | 12.00`),
      p("Read it once more, because every result below traces back to these facts: Ana has two orders, Chidi has one, Boris and Dana have none, and order 104 belongs to nobody."),
      p("One definition before we start. A join combines rows from two tables by pairing them wherever a condition — the ON clause — is true. Everything else is policy about what happens to rows that find no pair."),

      h2("INNER JOIN: only the pairs"),
      code("sql", `SELECT u.name, o.id AS order_id, o.total
FROM users u
INNER JOIN orders o ON o.user_id = u.id
ORDER BY u.name, o.id;`, "inner-join.sql"),
      code("text", ` name  | order_id | total
-------+----------+-------
 Ana   |      101 | 19.90
 Ana   |      102 |  4.50
 Chidi |      103 | 62.00
(3 rows)`),
      p("Walk it the way the database conceptually does. Take Ana (id 1) and look for orders with user_id = 1: orders 101 and 102 both match, so Ana appears twice — one output row per successful pairing. Boris (id 2): no order matches, so he contributes nothing. Chidi pairs with 103, one row. Dana pairs with nothing. And order 104? Its user_id is NULL, and NULL = 1 is not true in SQL, so it vanishes as well."),
      p("Two behaviours people misread, both visible in those three rows. First, rows multiply: a user with two matching orders becomes two result rows — that is finance seeing Ana 'twice' in the export. Second, rows disappear silently: an INNER JOIN answers 'which pairs exist', never 'what is in my table'. Boris and Dana were not removed by any WHERE clause you wrote; the join itself dropped them. That is the missing-customer dashboard from the intro, fully explained."),
      p("One spelling note: plain JOIN is a synonym for INNER JOIN. Deleting the word INNER changes nothing."),
      callout("info", "Deeper: you do not control how the join executes. SQL is declarative — the Postgres planner decides whether to start from users or from orders, and which algorithm to use (nested loop, hash join, merge join), based on table statistics. For inner joins it reorders tables freely: users JOIN orders and orders JOIN users produce identical plans. Outer joins constrain that freedom, because reordering them can change the result. So write joins for readability, and when one is slow, ask EXPLAIN ANALYZE what actually ran instead of shuffling the query text."),

      h2("LEFT JOIN: keep the left side, no matter what"),
      code("sql", `SELECT u.name, o.id AS order_id, o.total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
ORDER BY u.name, o.id;`, "left-join.sql"),
      code("text", ` name  | order_id | total
-------+----------+-------
 Ana   |      101 | 19.90
 Ana   |      102 |  4.50
 Boris |     NULL |  NULL
 Chidi |      103 | 62.00
 Dana  |     NULL |  NULL
(5 rows)`),
      p("Same pairing walk, one new rule: when a left-side row finds no pair, it is emitted anyway — exactly once, with every right-side column set to NULL. Boris and Dana are back. LEFT JOIN means 'the table I refuse to lose rows from comes first', and that is why it is the most common join in application code by a wide margin."),
      p("Now read Boris's row the way the database means it. NULL is not zero and not an empty string; it is SQL's marker for 'no value exists'. The row says: Boris, and no order to show. Misreading that is how the string 'null' leaks into UIs, and how aggregates mislead — AVG(o.total) skips NULLs entirely, which may or may not be what your report intends."),
      richP("The classic use of these placeholder rows is a per-user count that includes the zeros — and it contains this article's first trap. Count the join column, not the row: ", inlineCode("count(o.id)"), " counts only real orders, so Boris and Dana get 0. Write ", inlineCode("count(*)"), " and they get 1, because you counted the placeholder row itself. That off-by-one survives most code reviews; it should not survive this paragraph."),
      code("sql", `SELECT u.name, count(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name
ORDER BY u.name;`, "orders-per-user.sql"),

      h2("RIGHT and FULL: the rare ones"),
      p("RIGHT JOIN is the mirror image: keep every row from the right table and pad the left side with NULLs. Our guest order finally appears:"),
      code("sql", `SELECT u.name, o.id AS order_id, o.total
FROM users u
RIGHT JOIN orders o ON o.user_id = u.id
ORDER BY o.id;`, "right-join.sql"),
      code("text", ` name  | order_id | total
-------+----------+-------
 Ana   |      101 | 19.90
 Ana   |      102 |  4.50
 Chidi |      103 | 62.00
 NULL  |      104 | 12.00
(4 rows)`),
      p("The NULL in the name column is the guest checkout: an order that pairs with no user. In practice I almost never write RIGHT JOIN, and in review I ask for it to be flipped — SELECT ... FROM orders o LEFT JOIN users u says exactly the same thing while keeping the table you care about first, which is how everyone reads a query."),
      p("FULL OUTER JOIN keeps the unmatched rows from both sides at once:"),
      code("sql", `SELECT u.name, o.id AS order_id, o.total
FROM users u
FULL OUTER JOIN orders o ON o.user_id = u.id
ORDER BY u.name, o.id;`, "full-join.sql"),
      code("text", ` name  | order_id | total
-------+----------+-------
 Ana   |      101 | 19.90
 Ana   |      102 |  4.50
 Boris |     NULL |  NULL
 Chidi |      103 | 62.00
 Dana  |     NULL |  NULL
 NULL  |      104 | 12.00
(6 rows)`),
      p("Six rows: the three pairs, the two order-less users, the one user-less order. This is the reconciliation join — for two datasets that are supposed to agree, where any row with a NULL side is a discrepancy to investigate. Comparing a payment provider's export against your own orders table is the canonical case. If you write one FULL JOIN a year, that is normal."),

      h2("Pattern 1: fetch things with their relation"),
      p("Nearly every screen in an application is 'rows from one table, plus a column or two from a related one'. The orders admin page needs each order with the customer's name:"),
      code("sql", `SELECT o.id, o.total, coalesce(u.name, 'Guest') AS customer
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
ORDER BY o.id DESC
LIMIT 20;`, "orders-page.sql"),
      p("coalesce returns its first non-NULL argument — the tidy way to label the missing side. The only real decision in this query is INNER versus LEFT, and it is a data-model question, not a style question: can the relation be absent? Here user_id is nullable, so an INNER JOIN would silently hide guest orders from the admin — a bug that looks exactly like missing data. When the foreign key is NOT NULL, both joins return identical rows, and I write INNER because it tells the next reader the relation is guaranteed."),
      callout("tip", "Deeper: what makes a join cheap. For ON o.user_id = u.id, the planner loves an index on orders.user_id — to fetch one user's orders it can jump straight to the matching rows instead of scanning the whole table. Postgres indexes primary keys automatically but does NOT index foreign key columns: CREATE INDEX ON orders (user_id) is routinely one of the highest-value lines in a young schema. For large unfiltered joins the planner may still choose a hash join and read everything — that is not a failure, it is arithmetic about how many rows you asked for. EXPLAIN ANALYZE settles the argument either way."),

      h2("Pattern 2: find rows with no relation"),
      p("The second workhorse runs the other way: users who have never ordered — for a nudge campaign, say. The trick is to LEFT JOIN and keep only the placeholder rows:"),
      code("sql", `SELECT u.id, u.name
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;`, "never-ordered.sql"),
      p("Read it with the model you now have. The LEFT JOIN keeps all four users; Ana and Chidi come through with real order ids attached; Boris and Dana come through with o.id = NULL. The WHERE keeps only those NULL rows. This shape is called an anti-join: give me the left rows that have no match. One detail carries the whole trick — test a column that can never legitimately be NULL, like the right table's primary key, so that NULL can only mean 'no match ever happened'."),
      p("The same question phrased with NOT EXISTS reads closer to English, and Postgres executes it as an anti-join too. Pick whichever your team parses faster; I alternate depending on how complicated the surrounding query is:"),
      code("sql", `SELECT u.id, u.name
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);`, "never-ordered-exists.sql"),

      h2("The NOT IN trap"),
      p("There is a third phrasing, and it is the one everybody writes first:"),
      code("sql", `-- looks equivalent; returns 0 rows on our data
SELECT u.id, u.name
FROM users u
WHERE u.id NOT IN (SELECT o.user_id FROM orders o);`, "not-in-broken.sql"),
      p("The subquery returns the values (1, 1, 3, NULL) — that NULL is our guest order. And comparisons involving NULL are neither true nor false in SQL; they are unknown, the third value in SQL's three-valued logic. For Boris, u.id NOT IN (1, 1, 3, NULL) unrolls to 2 <> 1 AND 2 <> 1 AND 2 <> 3 AND 2 <> NULL. The first three are true; the last is unknown; true AND unknown is unknown — and WHERE only keeps rows whose condition is actually true. Every user fails the same way. Zero rows, no error, no warning."),
      p("The cruel part is the timeline. NOT IN works perfectly while the subquery happens to contain no NULLs — which is to say it works in development, in the test suite, and in production, right up until the first guest checkout lands. Then the campaign query quietly reports that nobody needs an email, and no one notices for a month."),
      callout("warning", "NOT IN over a nullable column is a correctness bug, not a style preference. Either exclude the NULLs explicitly (add WHERE o.user_id IS NOT NULL inside the subquery) or make NOT EXISTS your default habit — it treats NULLs sanely, and Postgres plans it as a proper anti-join."),

      h2("The same queries in Prisma"),
      p("If you arrived here from the ORM side, this is the mapping back. The schema mirrors our two tables — note the optional relation, which is Prisma's spelling of that nullable foreign key:"),
      code("text", `model User {
  id     Int     @id
  name   String
  email  String
  orders Order[]
}

model Order {
  id     Int      @id
  total  Decimal
  user   User?    @relation(fields: [userId], references: [id])
  userId Int?
}`, "prisma/schema.prisma"),
      code("ts", `// Pattern 1 — the orders page with customer names, guest-safe
const orders = await prisma.order.findMany({
  take: 20,
  orderBy: { id: "desc" },
  include: { user: true },    // user is null for order 104
});

// Pattern 1 in the other direction — users with their orders
const usersWithOrders = await prisma.user.findMany({
  include: { orders: true },  // orders: [] for Boris and Dana
});

// Pattern 2 — the anti-join: users who never ordered
const neverOrdered = await prisma.user.findMany({
  where: { orders: { none: {} } },
});`, "queries.ts"),
      richP("Two things are worth noticing. First, Prisma returns nested objects instead of the duplicated flat rows you saw in raw SQL — Ana comes back once with an orders array of two, not as two rows. The multiplication still happens conceptually; the ORM folds it back into shape for you. Second, ", inlineCode("orders: { none: {} }"), " compiles to a null-safe anti-join in the NOT EXISTS family — one of the places where letting the ORM write the SQL protects you from the trap in the previous section."),
      callout("info", "Deeper: what Prisma actually sends. Historically Prisma fetched include relations with separate queries and stitched the results together in the client; newer versions can push the work into a single database-level JOIN via the relationLoadStrategy option, depending on your version and configuration. Turn on query logging — log: [\"query\"] in the client constructor — and look. Once you can read joins, that log stops being noise and becomes a standing code review of your ORM."),

      h2("Where joins still bite"),
      p("Fan-out corrupts aggregates. Join users to two different one-to-many tables in the same query — orders and, say, support tickets — and each user's rows multiply into every combination: two orders times two tickets is four rows, and SUM(o.total) now counts each order twice. When a report comes out exactly double or triple the truth, hunt for the second one-to-many join. Aggregate each relation in its own subquery first, or run two queries and combine them in code."),
      p("A WHERE on the right table quietly cancels a LEFT JOIN. Add WHERE o.total > 10 under our LEFT JOIN and Boris and Dana disappear again: their total is NULL, NULL > 10 is unknown, and unknown rows are filtered out. You wrote LEFT and got INNER. If the intent is 'everyone, with only their larger orders attached', the condition belongs inside the ON clause:"),
      code("sql", `SELECT u.name, o.id AS order_id, o.total
FROM users u
LEFT JOIN orders o
  ON o.user_id = u.id AND o.total > 10.00
ORDER BY u.name, o.id;`, "filter-in-on.sql"),
      p("And pagination counts join rows, not entities. LIMIT 10 on a query where users fan out across orders returns ten rows, which might be four users — so page two starts mid-customer and your 'next page' logic breaks only for the customers with many orders, which is the worst possible place. Paginate the driving table in a subquery with its own LIMIT, then join the relations onto that."),

      h2("Where to go from here"),
      richP("Open psql, paste the setup script, and run every query in this article once — joins click through the fingers, not the eyes. For the wider tour of Postgres as an application developer, ", link("PostgreSQL for Web Developers: A Practical Guide", "/blog/postgresql-for-web-developers-a-practical-guide"), " continues from here. And if your joins mostly happen through an ORM, ", link("Prisma ORM: From Zero to Production", "/blog/prisma-orm-from-zero-to-production"), " shows how these same shapes look in a real schema with migrations and indexes."),
    ],
  },

  // ── C6-1 · APIs & Integrations · 2026-07-31 ─────────────────────────────
  {
    title: "REST API Design that Ages Well: Naming, Versioning, and Errors",
    excerpt:
      "URL schemes, status codes, and error bodies outlive every refactor. The API design decisions that are cheap this week and brutal next year — plus a review checklist.",
    categoryName: "APIs & Integrations",
    tagNames: ["REST API Design", "Node.js"],
    difficulty: "intermediate",
    seoTitle: "REST API Design Best Practices That Age Well",
    seoDescription:
      "REST API design best practices that survive production: resource naming, status codes, pagination, versioning, and RFC 9457 error bodies, with a checklist.",
    publishDate: "2026-07-31",
    readingTime: 11,
    imageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1400&q=80",
    imageAlt: "Shallow-focus photo of colorful source code on a computer screen",
    content: [
      p("Picture the API you shipped a year ago. One route is /users/42/orders, its neighbour is /getOrderHistory?uid=42, deletes go through POST /orders/remove, and every failure arrives as a 200 with { \"success\": false } tucked in the body. None of it is hard to fix. Except that a mobile app, a partner integration, and an automation someone built without telling you now depend on every one of those warts — and the fix has a new name: breaking production for other people."),
      p("Internal code forgives. You can rename a function and the compiler finds every caller. A published API is different: its callers live in other people's repositories, and every inconsistency you ship becomes a contract you must honour. The good news is that the decisions that make an API age well cost almost nothing on day one. These are the ones I hold the line on in reviews, with the reasoning spelled out — so you can disagree deliberately instead of by accident."),
      richP(bold("What you'll walk away with:"), " positions you can defend in a design review:"),
      ...bullet([
        "Naming and nesting rules that keep URLs predictable at endpoint number fifty",
        "The status codes teams get wrong most: 200-with-error, 204 versus 200, 409 versus 422",
        "A pagination envelope and a versioning strategy you will not have to walk back",
        "An RFC 9457 error shape with a TypeScript type and Express 5 middleware, ready to paste",
      ]),
      p("A note on the word REST before we start: I mean it in the working sense — resources identified by URLs, manipulated with HTTP methods, represented as JSON — not the full dissertation sense. Every rule below serves a single goal: a developer who has seen two of your endpoints can correctly guess the third."),

      h2("Name resources like a filing system, not like functions"),
      p("URLs identify things; HTTP methods supply the verbs. The moment a verb leaks into a path, the scheme starts drifting — there are infinitely many verbs and only a handful of methods, so verb-URLs never converge on a pattern. Plural nouns, lowercase, hyphens for multi-word names:"),
      code("text", ` instead of                     use
--------------------------------- -----------------------------
 GET  /getUserList               GET    /users
 GET  /user/42                   GET    /users/42
 POST /users/create              POST   /users
 POST /users/42/delete           DELETE /users/42
 GET  /users_orders?id=42        GET    /users/42/orders
 GET  /OrderItems/7              GET    /order-items/7`),
      p("Nothing in the left column is broken, exactly — it is worse than broken, it is unguessable. The right column follows two rules a new consumer absorbs in a minute: collections are plural nouns, and an id after a collection selects one member. Consistency matters more than any individual choice here; singular nouns everywhere would still beat a mixture."),
      p("Nesting is where good naming goes to die. My rule: one level, and only when the child is meaningless without the parent. /users/42/orders reads naturally as 'the orders of user 42'. But an order item has a globally unique id of its own, so forcing clients through /users/42/orders/7/items/3 makes them carry three ancestor ids just to build one URL:"),
      code("text", ` depth | example                        verdict
-------+-------------------------------- ------------------------------------
   0   | /orders/7                       the workhorse
   1   | /users/42/orders                fine: a scoped collection
   2   | /users/42/orders/7              redundant: order 7 IS /orders/7
   3   | /users/42/orders/7/items/3      painful for every client, forever`),
      p("Then there are the actions that refuse to be CRUD: cancel an order, resend an invitation, publish a draft. Two honest options exist. If the action has a lifecycle someone might inspect later, model it as a resource you create — POST /password-resets, POST /orders/42/refunds — because tomorrow somebody will ask to list them. If it is genuinely fire-and-forget, a verb sub-path such as POST /orders/42/cancel is pragmatic and fine. Keep those rare, documented, and always POST."),

      h2("Path or query string?"),
      p("The rule I teach: the path says which resource; the query string says how much of it, and in what shape. Identity goes in the path. Filtering, sorting, pagination, and expansion go in query parameters:"),
      code("text", ` belongs in the path                 belongs in the query string
------------------------------------- ---------------------------------
 which collection   /orders            filtering    ?status=paid
 which member       /orders/7          sorting      ?sort=-created_at
 ownership scope    /users/42/orders   pagination   ?cursor=abc&limit=50
                                       expansion    ?include=customer`),
      p("The litmus test: deleting any query parameter should still yield a valid request — a bigger, blander response, but a sensible one. Deleting a path segment should change which resource you are addressing, or 404. If removing a 'parameter' breaks the request entirely, it was identity wearing a costume, and it belongs in the path. And resist encoding filters as path segments (/orders/paid): the day marketing asks for two filters at once, that scheme has nowhere to go."),

      h2("The status codes people actually get wrong"),
      p("You need maybe a dozen status codes used honestly, not all sixty. Three specific mistakes cause most of the integration pain I get called into."),
      richP(bold("Returning 200 with an error in the body."), " This is the worst one, because everything downstream of you is built on the status line: fetch's ", inlineCode("res.ok"), ", retry policies, HTTP caches (200 responses may be cached — including your error), load-balancer health checks, and monitoring that now shows a perfectly green API while every request fails. The body is for humans and application code; the status line is your contract with infrastructure. If the request failed, say so where the machines look."),
      richP(bold("204 versus 200."), " 204 No Content means success with, literally, no body — a client that calls res.json() on it throws. So send 204 only where you mean it, and mean it consistently. My convention: DELETE returns 204; PUT and PATCH return 200 with the updated resource, because the caller almost always wants the result and it saves a follow-up GET. Either convention works; a mixture makes every client guess."),
      richP(bold("400 versus 422 versus 409 — the validation triangle."), " 400 means I could not parse the request: malformed JSON, wrong content type. 422 means I parsed it fine and it breaks your rules: invalid email, negative quantity. 409 means the request itself is fine but conflicts with current state: the email is already registered, the record changed under you, the thing you are deleting is still referenced. Clients genuinely handle these differently — 422 sends the user back to the form, 409 triggers refresh-and-retry, 400 is a bug in the caller — which is the whole reason to keep them distinct."),
      code("text", ` situation                                   return
--------------------------------------------- ----------------------
 read or update succeeded                     200
 created a resource                           201 + Location header
 accepted, will process asynchronously        202
 success, deliberately no body                204
 request could not be parsed                  400
 missing or invalid credentials               401
 authenticated, but not allowed               403
 resource does not exist (or is hidden)       404
 conflicts with current state                 409
 parsed fine, failed validation               422
 rate limited                                 429 + Retry-After
 we broke, not you                            500`),
      callout("info", "Deeper: idempotency is part of the contract. GET, PUT, and DELETE are defined as idempotent — repeating one yields the same end state, which is why clients and proxies feel entitled to retry them. POST is not, and a retried POST is exactly how duplicate orders happen. If a POST has real-world side effects (charging money, sending mail), accept an Idempotency-Key header and deduplicate on it server-side. Design every mutation as though some network will deliver it twice, because eventually one will."),

      h2("Pagination: the envelope you cannot retrofit"),
      p("An unpaginated collection endpoint is a time bomb with a pleasant early life. It returns a bare array, it works beautifully against the fifty rows in staging, and every client gets written against that bare array. When the table grows and you finally need pagination, adding it changes the response shape — a breaking change for every consumer at once. So collections get an envelope (a wrapper object around the array) from the first day, even while there is only one page of data:"),
      code("json", `{
  "data": [
    { "id": "ord_9412", "total": "62.00", "status": "paid" }
  ],
  "pagination": {
    "limit": 50,
    "next_cursor": "b3JkXzk0MTI",
    "has_more": false
  }
}`, "GET /v1/orders — response"),
      p("The fields I refuse to omit, each learned by omitting it once: has_more, because inferring 'last page' from a short page is wrong the day a page is legitimately short; next_cursor as an opaque string, so you can change what is inside it without anyone noticing; and limit echoed back, because the server clamps absurd requests and clients should see the clamp. The awkward one is total_count — clients love it, and on a large table it costs a full count on every request. Make it opt-in from the start (?include=total_count) so the default stays cheap and the option exists."),
      p("Offset versus cursor, honestly: offset pagination (?offset=100&limit=50) is simpler and lets users jump to page seven, but pages drift when rows are inserted mid-scroll, and deep offsets get slower because the database still walks everything it skips. Cursor pagination keys off the last row seen — stable under writes and consistently fast — but needs a stable, unique sort order (created_at plus id as a tiebreaker) and gives up page jumping. My default: cursors for anything user-facing or unbounded, offset for small internal admin tables where page numbers genuinely help."),

      h2("Versioning, compared without religion"),
      p("Everyone agrees an API must be able to change; nobody agrees on the spelling. There are three honest strategies, and the trade-offs are lopsided enough to pick confidently."),
      p("A version in the path — /v1/orders — is visible in every log line, every pasted curl command, every browser address bar. Routing two major versions side by side is trivial, and clients opt in explicitly. The cost is aesthetic: the URL of a resource changes when the major version does, which offends the purist reading of URLs as permanent identifiers. I can live with offended purists."),
      p("A version in a header — Accept: application/vnd.yourapi.v2+json, or a custom X-API-Version — keeps URLs pristine and allows per-request granularity. In exchange, the version disappears from logs and shared links, every debugging session starts with 'which version did you actually send?', caches must Vary on the header, and the default when the header is missing becomes a permanent trap: whatever you pick, half your clients end up depending on it by accident."),
      p("No version until needed — the additive-only discipline — works longer than people expect: add fields freely, never remove or rename, never change meanings. Its failure mode is the day discipline meets reality: you need one genuinely breaking change, there is no mechanism, and you invent one under deadline pressure. That is how APIs end up with a /v2 living next to unversioned legacy routes forever."),
      p("My recommendation is boring: put /v1 in the path from day one, then behave as if versions barely exist — evolve additively, and save real breaking changes until they are worth a /v2. The path costs one URL segment now; the day it pays off, it pays off enormously, and unlike the header scheme it never made anything harder to debug in the meantime. Write down in the docs exactly what you count as breaking — removing or renaming a field, changing a type or nullability, adding a required parameter, changing the meaning of a value — and state plainly that added response fields are not breaking, so clients must tolerate unknown fields. That sentence in your docs settles arguments before they start."),
      callout("tip", "Deeper: deprecation is the other half of versioning. A /v2 without a /v1 shutdown plan just doubles your maintenance surface permanently. When you deprecate, announce a date, emit a Sunset header (RFC 8594) with that date on every /v1 response, watch traffic on the old version, and contact the stragglers directly. The header will not make anyone migrate — but it makes 'you never told us' impossible."),

      h2("Errors: RFC 9457, and messages a human can act on"),
      p("Every team invents an error format, then invents two more under deadline, and clients end up parsing three shapes with one regex and a prayer. There is a standard: RFC 9457, Problem Details for HTTP APIs — the 2023 revision of the older RFC 7807. It defines a JSON body served with content type application/problem+json and five fields: type, a URI identifying the class of problem; title, a short summary that stays stable per type; status, echoing the code; detail, what went wrong this time; instance, where. Plus any extension members you need:"),
      code("json", `{
  "type": "https://api.example.com/problems/validation-failed",
  "title": "Request failed validation",
  "status": 422,
  "detail": "Two fields are invalid.",
  "instance": "/v1/users",
  "errors": [
    { "field": "email", "message": "must be a valid email address" },
    { "field": "age",   "message": "must be at least 13" }
  ]
}`, "422 response body"),
      p("In TypeScript, the shape plus an error class you can throw from anywhere in the request path:"),
      code("ts", `export interface ProblemDetails {
  type: string;       // URI for the problem class; "about:blank" if generic
  title: string;      // short summary, stable per problem type
  status: number;     // mirrors the HTTP status code
  detail?: string;    // human-readable, specific to this occurrence
  instance?: string;  // the path that produced it
  errors?: { field: string; message: string }[]; // extension member
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail?: string,
    public readonly errors?: { field: string; message: string }[],
  ) {
    super(detail ?? title);
  }
}`, "src/problem.ts"),
      code("ts", `import type { NextFunction, Request, Response } from "express";
import { ApiError, type ProblemDetails } from "./problem.js";

export function problemHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const problem: ProblemDetails =
    err instanceof ApiError
      ? {
          type: "about:blank",
          title: err.title,
          status: err.status,
          detail: err.detail,
          instance: req.path,
          errors: err.errors,
        }
      : {
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          instance: req.path,
        };

  if (problem.status >= 500) {
    console.error(err); // log the real error; never send it to the client
  }

  res
    .status(problem.status)
    .type("application/problem+json")
    .json(problem);
}`, "src/problem-handler.ts"),
      p("Register it after all routes. Express 5 recognises the four-parameter signature as an error handler, and — new in version 5 — rejected promises in async handlers land here automatically, so a route can simply throw:"),
      code("ts", `app.get("/v1/orders/:id", async (req, res) => {
  const order = await findOrder(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  res.json(order);
});

app.use(problemHandler);`, "src/routes.ts"),
      p("Two deliberate simplifications in that middleware. I start every API with type: \"about:blank\" — the RFC's own 'no particular type' URI — and mint specific problem URIs only when a client genuinely needs to branch on the kind of error, because a published URI is one more thing you can never rename. And the errors array is an extension member, which the RFC explicitly permits; consumers that only know the standard fields simply ignore it."),
      p("One writing rule for detail: tell the caller what to change, not what you felt. 'must be at least 13' beats 'validation error'; 'cursor has expired, restart from the first page' beats 'bad request'. And never leak internals — stack traces, SQL fragments, and library error messages are reconnaissance gifts wrapped as helpfulness, which is why the handler above logs the real error and sends a deliberately bland 500."),

      h2("Where good designs still rot"),
      richP(bold("Nesting on a relation that changes. "), "/users/42/orders bakes 'an order belongs to exactly one user' into every client's URL-building code. The day orders can also belong to organizations, flat routes with a filter (/orders?user_id=42) absorb the change; nested ones demand a migration. Nest for true, permanent ownership — never for convenience."),
      richP(bold("403 as an existence oracle. "), "If /invoices/9931 returns 403 for someone else's invoice but 404 for a missing one, you have just confirmed that invoice 9931 exists — and across many ids, that difference becomes an enumeration tool for mapping your customers. I return 404 for anything the caller is not allowed to see, and log the authorization denial separately for my own debugging. The trade-off is some honest confusion for misconfigured partners, which is why the behaviour belongs in your docs."),
      richP(bold("Formats you never pinned. "), "Dates as ISO 8601 UTC strings with the trailing Z, from the very first endpoint — mixed date formats are close to impossible to unwind later. Money as integer minor units or decimal strings, never floats. And ids as strings in JSON even while they are integers in the database, so that moving to prefixed ids like ord_9412 later is not a type change for every client."),
      richP(bold("Undocumented behaviour becomes the contract anyway. "), "Clients depend on everything observable — your default sort order, your timestamp precision, the casing of an enum — whether you documented it or not. You cannot prevent that; you can only decide which behaviours you promise, write those down, and mark the rest explicitly unstable so at least the argument is short."),

      h2("The review checklist"),
      p("Run your API against this list before the next client integrates. Twenty minutes, answered honestly, is cheaper than any deprecation cycle:"),
      ...numbered([
        "Paths are lowercase plural nouns; no verb has leaked into a URL, except documented action endpoints.",
        "Nothing nests deeper than one level; anything with a globally unique id is reachable at a top-level path.",
        "Identity lives in the path, modifiers in the query string — removing any query parameter still yields a valid request.",
        "No endpoint returns 200 for a failure; res.ok tells the truth on every route.",
        "400, 409, and 422 mean parse failure, state conflict, and validation failure respectively — and nothing else.",
        "Every collection returns the envelope: data, plus pagination with limit, next_cursor, and has_more.",
        "Every path starts with /v1, and the docs define exactly which changes count as breaking.",
        "Errors are application/problem+json with type, title, status, and a detail the caller can act on; 500 bodies leak nothing.",
        "Dates are ISO 8601 UTC, money is never a float, ids are strings.",
        "Every unsafe operation is idempotent, accepts an idempotency key, or is documented as unsafe to retry.",
      ]),

      h2("Where to go from here"),
      richP("Design is the half of the job you cannot patch afterwards; the other half is implementation, and that one you can iterate on. ", link("Building REST APIs with Node.js and Express", "/blog/building-rest-apis-with-node-js-and-express"), " covers the Express side — routing, middleware, validation — if you want to put this structure under a real codebase. And before anyone tells you GraphQL makes all of this obsolete, read ", link("GraphQL vs REST: When to Use Each in 2025", "/blog/graphql-vs-rest-when-to-use-each-in-2025"), " — the trade-offs are more interesting than the slogans."),
    ],
  },
];

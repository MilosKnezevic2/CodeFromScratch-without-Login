/**
 * Rewrites the "what-is-web-development-beginners-guide" Sanity post with a
 * proper 1700-word intro to web development, uploads a fresh hero image and
 * inline tech-logo images, and patches the body, excerpt, reading time, and
 * difficulty in one commit.
 *
 * Run: node scripts/update-web-dev-intro.mjs
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const SLUG = "what-is-web-development-beginners-guide";

const k = () => randomUUID().slice(0, 12);

// ─── Portable Text helpers ─────────────────────────────────────────────────
function p(text) {
  return {
    _type: "block",
    _key: k(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: k(), text, marks: [] }],
  };
}
function richP(...spans) {
  return {
    _type: "block",
    _key: k(),
    style: "normal",
    markDefs: [],
    children: spans.map((s) =>
      typeof s === "string"
        ? { _type: "span", _key: k(), text: s, marks: [] }
        : s,
    ),
  };
}
function bold(text) {
  return { _type: "span", _key: k(), text, marks: ["strong"] };
}
function em(text) {
  return { _type: "span", _key: k(), text, marks: ["em"] };
}
function h2(text) {
  return {
    _type: "block",
    _key: k(),
    style: "h2",
    markDefs: [],
    children: [{ _type: "span", _key: k(), text, marks: [] }],
  };
}
function h3(text) {
  return {
    _type: "block",
    _key: k(),
    style: "h3",
    markDefs: [],
    children: [{ _type: "span", _key: k(), text, marks: [] }],
  };
}
function code(language, codeText, filename) {
  return { _type: "code", _key: k(), language, code: codeText, filename };
}
function callout(type, text) {
  return { _type: "callout", _key: k(), type, text };
}
function lead(text) {
  return { _type: "lead", _key: k(), text };
}
function divider(style = "plain") {
  return { _type: "divider", _key: k(), style };
}
function bullet(items) {
  return items.map((entry) => {
    const spans = Array.isArray(entry)
      ? entry.map((s) =>
          typeof s === "string"
            ? { _type: "span", _key: k(), text: s, marks: [] }
            : s,
        )
      : [{ _type: "span", _key: k(), text: entry, marks: [] }];
    return {
      _type: "block",
      _key: k(),
      style: "normal",
      listItem: "bullet",
      level: 1,
      markDefs: [],
      children: spans,
    };
  });
}
function img(assetId, alt, caption, size = "full") {
  return {
    _type: "image",
    _key: k(),
    asset: { _type: "reference", _ref: assetId },
    alt,
    caption,
    size,
    alignment: "center",
  };
}

// ─── Upload image from URL ─────────────────────────────────────────────────
async function uploadImage(url, filename) {
  console.log(`  ↑ uploading ${filename}…`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buf, { filename });
  return asset._id;
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`▸ Looking up post by slug: ${SLUG}`);
  const post = await client.fetch(
    `*[_type == "post" && slug.current == $slug][0]{_id, title}`,
    { slug: SLUG },
  );
  if (!post) {
    throw new Error(`No post found with slug "${SLUG}"`);
  }
  console.log(`▸ Found: ${post._id} — "${post.title}"`);

  console.log("▸ Uploading images…");
  const [
    heroId,
    htmlId,
    cssId,
    jsId,
    reactId,
    nodeId,
    vscodeId,
    teamId,
    cloudId,
  ] = await Promise.all([
    uploadImage(
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600&q=80&auto=format&fit=crop",
      "hero-code.jpg",
    ),
    uploadImage(
      "https://raw.githubusercontent.com/github/explore/main/topics/html/html.png",
      "html-logo.png",
    ),
    uploadImage(
      "https://raw.githubusercontent.com/github/explore/main/topics/css/css.png",
      "css-logo.png",
    ),
    uploadImage(
      "https://raw.githubusercontent.com/github/explore/main/topics/javascript/javascript.png",
      "javascript-logo.png",
    ),
    uploadImage(
      "https://raw.githubusercontent.com/github/explore/main/topics/react/react.png",
      "react-logo.png",
    ),
    uploadImage(
      "https://raw.githubusercontent.com/github/explore/main/topics/nodejs/nodejs.png",
      "nodejs-logo.png",
    ),
    uploadImage(
      "https://raw.githubusercontent.com/github/explore/main/topics/visual-studio-code/visual-studio-code.png",
      "vscode-logo.png",
    ),
    uploadImage(
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&q=80&auto=format&fit=crop",
      "team-coding.jpg",
    ),
    uploadImage(
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&q=80&auto=format&fit=crop",
      "server-cloud.jpg",
    ),
  ]);
  console.log("▸ All images uploaded.");

  // ─── Build the article ──────────────────────────────────────────────────
  const content = [
    lead(
      "Web development is what powers everything you do online — from booking a flight to reading this sentence. It is also one of the most accessible careers in tech: you can build real products in your browser within hours of starting. Here is an honest beginner's map of the territory.",
    ),

    // §1 — What it is
    h2("What web development actually means"),
    p(
      "Web development is the craft of building anything that runs in a web browser — websites, apps, dashboards, online stores, internal tools, games, banking interfaces, dating apps. Every time you tap a button on a site or scroll a feed, you are standing on someone's code. That code is web development.",
    ),
    p(
      "The web has three audiences in any product. Users want it to feel fast and obvious. Businesses want it to convert visitors into customers. Developers want it to be maintainable and reasonably fun to build. A web developer's job is to satisfy all three at once.",
    ),
    p(
      "You do not need a degree, a maths background, or expensive software to start. You need a browser, a text editor, and the patience to ship things that look bad before they look good. The web has lower barriers to entry than almost any other engineering discipline — your phone can browse the same internet your code will eventually live on.",
    ),

    // §2 — Why
    h2("Why people learn it"),
    p(
      "The honest reasons people come to web development:",
    ),
    ...bullet([
      "It pays well in most countries with reliable internet — entry-level salaries in the EU sit between €30,000 and €50,000, senior roles routinely cross €80,000.",
      "Remote work is normal. You can do this from a small town in Austria or a coffee shop in Bangkok.",
      "You can freelance, take a job, build your own products, or do all three at the same time.",
      "You see the result of your work in thirty seconds. Refresh the page and your change is live.",
      "It teaches you to think in systems — a transferable skill that survives any technology change.",
    ]),
    p(
      "The dishonest reasons we will skip: \"you will be rich in six months\", \"AI will do the work for you\", \"coding is the new literacy\". The truth is closer to this — if you put in twelve months of real practice, you become employable and able to build the things you imagine.",
    ),
    callout(
      "tip",
      "You do not need a computer science degree. Most working web developers — including senior engineers at Apple, Google, and Stripe — are self-taught or came through bootcamps. Universities teach computer science; the web rewards people who ship.",
    ),

    img(
      teamId,
      "Two developers reviewing code on a laptop in a sunlit workspace",
      "Web development is one of the few careers where you can ship a working product on day one.",
      "full",
    ),

    // §3 — Three pillars
    h2("The three pillars: HTML, CSS, JavaScript"),
    p(
      "Every website ever made comes down to three languages running inside your browser. Master these three and the rest of the field becomes a steady climb instead of a cliff.",
    ),

    img(htmlId, "HTML5 logo", "HTML — the structure", "small"),
    richP(
      bold("HTML — the structure."),
      " HTML stands for HyperText Markup Language. It is the bones of every page: headings, paragraphs, lists, images, forms, links. If you stripped a beautiful website of all its styling and interactivity, what would remain is the HTML — like the framing of a house before paint and furniture arrive.",
    ),

    img(cssId, "CSS3 logo", "CSS — the appearance", "small"),
    richP(
      bold("CSS — the appearance."),
      " Cascading Style Sheets is how websites get their colour, spacing, typography, layout, and animation. The same HTML page can look like a 1995 government form or a 2026 Apple product page depending on the CSS. It is the most underrated of the three because design is what makes the web feel premium or cheap on first impression — and first impressions decide whether a visitor stays.",
    ),

    img(jsId, "JavaScript logo", "JavaScript — the behaviour", "small"),
    richP(
      bold("JavaScript — the behaviour."),
      " When you click \"Add to cart\" and a small badge updates without reloading the page, that is JavaScript. When a search bar suggests results as you type, that is JavaScript. When a dashboard streams live numbers, that is JavaScript. It is the language that brings flat pages alive.",
    ),

    p(
      "Here is what all three look like together in their simplest form. Save this as a file ending in .html, open it in any browser, and you have made a website:",
    ),
    code(
      "html",
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My first page</title>
    <style>
      body { font-family: system-ui; padding: 2rem; }
      button {
        background: #000;
        color: #fff;
        padding: 12px 24px;
        border: 0;
        border-radius: 8px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <h1>Hello, web.</h1>
    <p>I built this in five minutes.</p>
    <button onclick="alert('Clicked!')">Click me</button>
  </body>
</html>`,
      "index.html",
    ),
    p(
      "That is the entire stack at its most basic. Everything else — React, TypeScript, databases, Vercel, Docker, Kubernetes — is a layer of convenience and power on top of those three. Treat HTML, CSS, and JavaScript as your foundation, not as a stage to escape.",
    ),

    // §4 — Frontend / Backend / Fullstack
    h2("Frontend, backend, full-stack — what they actually mean"),
    p(
      "You will see job titles like \"Frontend Developer\", \"Backend Engineer\", and \"Full-stack Developer\". They describe what part of the system you spend your day building.",
    ),

    h3("Frontend"),
    p(
      "Frontend is everything that runs in the user's browser. Layout, animations, forms, the way a button feels under your finger on a phone. Frontend developers care about typography, accessibility, performance budgets, and pixel-perfect responsiveness across devices. Modern frontend rarely uses raw HTML, CSS, and JS by itself — most teams reach for a framework that solves common problems for you.",
    ),
    img(reactId, "React logo", "React — the most-used frontend framework in 2026", "small"),
    p("The popular frontend choices right now:"),
    ...bullet([
      [bold("React"), " — built by Meta, dominant in job listings, massive ecosystem of libraries."],
      [bold("Next.js"), " — production-grade React with routing, server rendering, and image optimisation built in. Powers Stripe, Notion, Vercel, this blog."],
      [bold("Vue.js"), " — gentler learning curve than React, very popular in Europe and Asia."],
      [bold("Svelte / SvelteKit"), " — smaller bundle sizes, growing community, beloved by people who try it."],
      [bold("SolidJS"), " — best raw performance numbers, smaller ecosystem but worth watching."],
    ]),

    h3("Backend"),
    p(
      "Backend is everything the user never sees: the server that takes their order, the database that stores their account, the email service that sends the receipt at 3 AM. Backend developers care about correctness, scale, security, and what happens when ten thousand people try to do the same thing in the same second.",
    ),
    img(nodeId, "Node.js logo", "Node.js — runs JavaScript outside the browser, on the server", "small"),
    p("Common backend stacks you will meet:"),
    ...bullet([
      [bold("Node.js with Express, Fastify, or Hono"), " — JavaScript on the server. Same language as your frontend, which is why most full-stack tutorials use it."],
      [bold("Python with Django or FastAPI"), " — popular in startups and data-heavy applications. Great ecosystem for machine learning if you ever drift that direction."],
      [bold("Go"), " — fast and minimal, used by Stripe, Cloudflare, Docker. Becoming the default for performance-sensitive services."],
      [bold("PHP with Laravel"), " — still powers most of the web. WordPress alone is roughly 40 percent of all sites."],
      [bold("Ruby on Rails"), " — what built GitHub, Shopify, and Basecamp. Less hyped, still excellent for shipping fast."],
    ]),
    p(
      "Databases live alongside the backend. PostgreSQL, MySQL, SQLite, MongoDB, and Redis are the names you will see most often. PostgreSQL is the safe default for almost every new project in 2026 — battle-tested, free, supports everything from simple key-value to full-text search.",
    ),

    h3("Full-stack"),
    p(
      "Full-stack is someone who can do both halves at a reasonable level. Most freelancers and small-startup developers end up full-stack out of necessity — when a local business hires you to build their website, they need it to work end-to-end, not just look nice. Being full-stack does not mean being expert at both; it means being competent enough to ship a product without handing pieces to other people.",
    ),

    // §5 — How a website works
    h2("How a website actually works"),
    p(
      "This is the moment most beginners get lost, so here is a simple version that is enough to keep you going for the first year.",
    ),
    ...bullet([
      "You type codefromscratch.org into your browser and press enter.",
      "Your browser asks a DNS server: \"what is the IP address for that domain?\" The DNS server replies with something like 142.250.180.46.",
      "Your browser opens a network connection to that IP and asks for the page using a protocol called HTTP.",
      "The server (running somewhere — Vercel, AWS, a closet in Berlin) reads the request, possibly talks to a database, builds an HTML response, and sends it back.",
      "Your browser parses the HTML, downloads the CSS and JavaScript files it references, and renders the page on screen.",
      "JavaScript runs and makes the page interactive — buttons click, forms submit, animations play.",
    ]),
    p(
      "Steps 4 and 5 are where the entire industry of frontend and backend lives. Steps 1 to 3 are infrastructure — you will learn enough about them to be dangerous, but you do not need to become a network engineer to build great websites.",
    ),

    img(
      cloudId,
      "Cloud servers in a data centre, glowing blue",
      "Behind every page load there is a server somewhere doing work for you.",
      "full",
    ),

    // §6 — Tools
    h2("Tools you will meet in the first month"),
    p(
      "You do not need a powerful computer to learn web development. Any laptop made in the last six years can do this comfortably. Here are the tools that show up on day one and stay with you for the rest of your career:",
    ),
    img(vscodeId, "Visual Studio Code logo", "VS Code — the default editor for most working web developers", "small"),
    ...bullet([
      [bold("A code editor"), " — VS Code is the default. Free, fast, and has an extension for every imaginable language and workflow."],
      [bold("A browser with developer tools"), " — Chrome, Firefox, Edge, or Safari all work. Press F12 (or Cmd+Option+I on Mac) and a panel opens that lets you inspect any webpage on earth."],
      [bold("Git and GitHub"), " — version control. Git tracks every change to your files; GitHub is where most of the world's code is stored, shared, and reviewed. Learning Git in week one will save you from a lot of future pain."],
      [bold("Node.js and npm"), " — Node lets you run JavaScript outside the browser; npm is the package manager that installs the thousands of libraries other developers have written for you."],
      [bold("A terminal"), " — the black window with text where you type commands. Scary at first, useful forever. You only need to learn about ten commands to get started."],
    ]),
    p(
      "That is it. No paid IDE, no expensive design software, no Mac required. The total cost to start learning web development is zero.",
    ),

    // §7 — Where to start (realistic timeline)
    h2("Where to start: a realistic timeline"),
    p(
      "This is the section where most beginner guides lie to you. \"Become a developer in 30 days\" sells courses, but it does not match reality. Almost nobody learns web development in a month. Most people who eventually land a job spent twelve to twenty-four months getting there, working evenings and weekends around a day job. That is normal, and it is not a sign you are slow.",
    ),
    p(
      "Set your expectations honestly and you will outlast the people who set them wrongly. Below is a timeline that reflects how real beginners actually progress when they study consistently a few hours a week.",
    ),

    h3("Months 1–3 — HTML and CSS, slowly"),
    p(
      "Your first three months are about getting comfortable with the idea that a website is a file. Learn what HTML tags are. Write a personal page with a heading, a paragraph, a list, an image, and a link. Get frustrated when CSS does not centre things the way you expect — that is a rite of passage every web developer has been through.",
    ),
    p(
      "By the end of month three, a reasonable goal is to be able to copy a simple webpage you see online — a personal portfolio, a small landing page — by hand, without using a template. You will not be fast. You will not always understand why something works. That is fine. Repetition is the teacher here.",
    ),

    h3("Months 3–6 — meet JavaScript"),
    p(
      "JavaScript is where most beginners hit the first real wall. Concepts like functions, scope, asynchronous code, and the difference between an array and an object take time to settle in. Expect to re-learn the same idea four or five times before it sticks. This is universal — even people who are good at it now were confused at this stage.",
    ),
    p(
      "Goal for this period: be able to add interactivity to a static page you built. A button that toggles dark mode. A simple to-do list. A counter that remembers itself when you refresh. Boring on paper, huge on confidence.",
    ),

    h3("Months 6–12 — your first real project"),
    p(
      "Around month six things start to feel possible. You begin combining HTML, CSS, and JavaScript without thinking about each one separately. This is when you should pick one larger project and stick with it — a personal blog, a portfolio with case studies, a small tool that solves a real problem you have. Finishing something imperfect is more educational than starting five things and abandoning them.",
    ),
    p(
      "Towards the end of your first year, you can start exploring a framework like React, Vue, or SvelteKit. Do not rush into one earlier — the people who jump to React in month two end up confused because they never understood the underlying JavaScript first.",
    ),

    h3("Year two — towards employability"),
    p(
      "The second year is where the picture changes. By now you have built real things, broken them, fixed them, and learnt from each cycle. This is the year to deepen — pick a framework, learn how to fetch data from an API, deploy a project to Vercel or Netlify, write your first lines of backend code, learn the basics of databases. Start sharing your work publicly even if it feels embarrassing.",
    ),
    p(
      "Most career-changers land their first paid web work — freelance gig, junior role, internal tooling at their current company — somewhere between month twelve and month twenty-four of serious practice. People who study three hours a week take longer. People who study fifteen hours a week and build things in public get there faster. The variation is enormous and it is mostly about consistency, not talent.",
    ),
    callout(
      "info",
      "If you put in two to four hours an evening, three or four evenings a week, expect to be employable in twelve to twenty-four months. If you can only manage an hour twice a week, expect three to four years. Either path works — the question is whether you keep showing up, not how fast you move.",
    ),

    // §8 — Myths
    h2("Common myths, gently corrected"),
    ...bullet([
      [
        em("You need to be good at maths."),
        " You need to be good at logical thinking. The maths required to build 95 percent of the web is multiplication and percentages. Game engines and 3D graphics are exceptions — most of web development is not maths-heavy.",
      ],
      [
        em("It is too late to start at 30 / 40 / 50."),
        " This industry has the highest proportion of career-changers of any technical field. Your previous career is an advantage, not a debt — empathy, communication, and project management are rarer than coding skill.",
      ],
      [
        em("AI will replace developers."),
        " AI is excellent at typing code and bad at deciding what code to type. The bottleneck has always been understanding the problem; the typing was the easy part. AI raises the floor; it does not replace the people who define the floor.",
      ],
      [
        em("You need to learn everything before you start."),
        " You need to learn enough to build one small thing, then learn the next thing as you build the next small thing. Forever. Nobody knows the whole field — not even the people who built it.",
      ],
      [
        em("Open source is for advanced developers."),
        " Most open source contributors are intermediate developers, and everybody writes their first pull request as a beginner. Fixing a typo in documentation counts.",
      ],
    ]),

    // §Summary
    divider("decorative"),
    h2("Summary — the short version"),
    p(
      "You are not picking a final career. You are picking a starting direction.",
    ),
    p(
      "The three pillars are HTML, CSS, and JavaScript. Everything else is a layer on top. Frontend lives in the browser; backend lives on the server; full-stack moves between them. You do not need a degree or expensive tools — you need a laptop, a browser, a text editor, and consistent practice.",
    ),
    p(
      "Start with one small project. Ship it imperfectly. Pick the next one. Repeat that loop for twelve months and you will be employable. Repeat it for five years and you will be senior.",
    ),
    p(
      "This blog exists to help you do exactly that. Bookmark it — over the next year we will go from your first heading tag to deploying a production application that handles real users, real payments, and real traffic.",
    ),
    callout(
      "tip",
      "The web is the most accessible career in technology. You have already done the hardest part — deciding to start.",
    ),
  ];

  console.log("▸ Patching post body…");
  const result = await client
    .patch(post._id)
    .set({
      content,
      excerpt:
        "An honest, practical map of web development for absolute beginners — what it is, why people learn it, the three core technologies, the frontend vs backend split, the tools you'll need, and a realistic 30-day starting plan.",
      readingTime: 13,
      difficulty: "beginner",
      featuredImage: {
        _type: "image",
        asset: { _type: "reference", _ref: heroId },
        alt: "A laptop screen filled with code, lit warmly against a dark workspace",
      },
      seoTitle: "What is Web Development? A Beginner's Map (2026 Guide)",
      seoDescription:
        "An honest beginner's guide to web development in 2026 — HTML, CSS, JavaScript, frontend vs backend, the tools you need, and a realistic 30-day plan to get started.",
    })
    .commit();

  console.log(`▸ Done. Post updated: ${result._id}`);
  console.log(`  → http://localhost:3000/blog/${SLUG}`);
}

main().catch((err) => {
  console.error("✗ Failed:", err);
  process.exit(1);
});

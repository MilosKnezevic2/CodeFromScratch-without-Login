/**
 * Targeted patch — replace the unrealistic "first month" learning plan with
 * an honest 12-24 month timeline that respects how long real beginners take.
 *
 * Run: node scripts/fix-realistic-timeline.mjs
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
const p = (text) => ({
  _type: "block",
  _key: k(),
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: k(), text, marks: [] }],
});
const h2 = (text) => ({
  _type: "block",
  _key: k(),
  style: "h2",
  markDefs: [],
  children: [{ _type: "span", _key: k(), text, marks: [] }],
});
const h3 = (text) => ({
  _type: "block",
  _key: k(),
  style: "h3",
  markDefs: [],
  children: [{ _type: "span", _key: k(), text, marks: [] }],
});
const callout = (type, text) => ({
  _type: "callout",
  _key: k(),
  type,
  text,
});

const replacement = [
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
];

const post = await client.fetch(
  `*[_type == "post" && slug.current == $slug][0]{_id, content}`,
  { slug: SLUG },
);
if (!post) {
  console.error(`No post found for slug "${SLUG}"`);
  process.exit(1);
}

// Locate the H2 "Where to start..." and the next H2 boundary.
const isWhereToStartH2 = (b) =>
  b?._type === "block" &&
  b?.style === "h2" &&
  Array.isArray(b?.children) &&
  b.children.some((c) =>
    typeof c?.text === "string" && c.text.startsWith("Where to start"),
  );
const isNextH2 = (b) =>
  b?._type === "block" &&
  b?.style === "h2" &&
  Array.isArray(b?.children) &&
  b.children.some((c) =>
    typeof c?.text === "string" &&
    (c.text.includes("Common myths") || c.text.includes("Summary")),
  );

const startIdx = post.content.findIndex(isWhereToStartH2);
if (startIdx === -1) {
  console.error("Could not find the 'Where to start' H2 — aborting.");
  process.exit(1);
}
let endIdx = -1;
for (let i = startIdx + 1; i < post.content.length; i++) {
  if (isNextH2(post.content[i])) {
    endIdx = i;
    break;
  }
}
if (endIdx === -1) {
  console.error("Could not find the boundary after 'Where to start'.");
  process.exit(1);
}

const before = post.content.slice(0, startIdx);
const after = post.content.slice(endIdx);
const next = [...before, ...replacement, ...after];

await client.patch(post._id).set({ content: next }).commit();
console.log(
  `Replaced ${endIdx - startIdx} blocks with ${replacement.length} new blocks.`,
);
console.log(`→ http://localhost:3000/blog/${SLUG}`);

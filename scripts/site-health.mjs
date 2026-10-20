/**
 * Weekly health check of the LIVE site. Reads sitemap.xml and, for every URL,
 * checks status, title, meta description, canonical, og:image and a single h1;
 * then checks every internal link found on those pages. Also asserts that an
 * unknown URL answers 404 (not a soft 404) and that robots.txt and the RSS
 * feed respond.
 *
 * Run: node scripts/site-health.mjs [--site https://codefromscratch.org]
 * Exit code 1 when any FAIL is found; WARN lines never fail the run.
 */

const siteArg = process.argv.indexOf("--site");
const SITE = (siteArg >= 0 ? process.argv[siteArg + 1] : "https://codefromscratch.org").replace(/\/$/, "");
const CONCURRENCY = 5;

const fails = [];
const warns = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);

async function get(url) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "cfs-site-health" } });
    return { status: res.status, text: await res.text(), url: res.url };
  } catch (e) {
    return { status: 0, text: "", error: e.message };
  }
}

async function pool(items, worker) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) await worker(queue.shift());
    }),
  );
}

const attr = (html, re) => re.exec(html)?.[1]?.trim();

function checkPage(url, html) {
  const title = attr(html, /<title[^>]*>([^<]*)<\/title>/i);
  if (!title) fail(`${url}: missing <title>`);
  else if (title.length > 70) warn(`${url}: title is ${title.length} chars`);
  if (!attr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i)) warn(`${url}: no meta description`);
  const canonical = attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  if (!canonical) fail(`${url}: missing canonical`);
  else if (canonical.replace(/\/$/, "") !== url.replace(/\/$/, "")) warn(`${url}: canonical is ${canonical}`);
  if (!attr(html, /<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i)) warn(`${url}: no og:image`);
  const h1s = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1s !== 1) warn(`${url}: ${h1s} <h1> elements (expected 1)`);
}

function internalLinks(html) {
  const found = new Set();
  for (const m of html.matchAll(/href="([^"#?]+)[^"]*"/gi)) {
    const href = m[1];
    if (href.startsWith("/") && !href.startsWith("//") && !/\.(css|js|png|jpg|svg|ico|webp|woff2?)$/i.test(href) && !href.startsWith("/_next")) {
      found.add(SITE + href);
    } else if (href.startsWith(SITE)) {
      found.add(href);
    }
  }
  return found;
}

const sitemap = await get(`${SITE}/sitemap.xml`);
if (sitemap.status !== 200) {
  console.log(`FAIL sitemap.xml -> ${sitemap.status}`);
  process.exit(1);
}
const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`site: ${SITE}\nsitemap URLs: ${urls.length}`);

const links = new Set();
await pool(urls, async (url) => {
  const page = await get(url);
  if (page.status !== 200) return fail(`${url}: status ${page.status}`);
  checkPage(url, page.text);
  for (const l of internalLinks(page.text)) links.add(l);
});

const unchecked = [...links].filter((l) => !urls.includes(l));
await pool(unchecked, async (link) => {
  const res = await get(link);
  if (res.status !== 200) fail(`broken internal link: ${link} -> ${res.status}`);
});

const unknown = await get(`${SITE}/blog/this-page-does-not-exist-health-check`);
if (unknown.status !== 404) fail(`unknown URL answers ${unknown.status}, expected 404 (soft 404)`);
for (const path of ["/robots.txt", "/blog/rss.xml"]) {
  const res = await get(SITE + path);
  if (res.status !== 200) fail(`${path} -> ${res.status}`);
}

for (const m of fails) console.log(`FAIL  ${m}`);
for (const m of warns) console.log(`WARN  ${m}`);
console.log(
  `\n${urls.length} pages, ${unchecked.length} extra internal links checked: ` +
    `${fails.length} fail(s), ${warns.length} warning(s)`,
);
process.exit(fails.length > 0 ? 1 : 0);

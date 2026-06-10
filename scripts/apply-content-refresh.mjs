/**
 * June 2026 content refresh — applies the launch content triage in one run:
 *
 * 1. For each draft JSON in content-drafts/draft-<slug>.json: convert the
 *    block spec to Portable Text and patch the published post (content,
 *    title, excerpt, readingTime) + unify the author to Milos Knezevic.
 * 2. Unpublish the 13 thin/off-positioning stubs (status -> draft) so the
 *    public journal ships 10 articles of consistent quality.
 *
 * Sanity keeps full revision history — every change here is reversible
 * from Studio (document history) if anything needs to come back.
 *
 * Run: node scripts/apply-content-refresh.mjs          (dry run)
 *      node scripts/apply-content-refresh.mjs --apply  (writes to Sanity)
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const APPLY = process.argv.includes("--apply");
const MILOS_AUTHOR_ID = "47455f55-daea-449c-b813-f1d8d3c4b08b";

const UNPUBLISH_SLUGS = [
  "getting-started-with-nextjs",
  "building-real-time-features-with-websockets-and-next-js",
  "building-rest-apis-with-node-js-and-express",
  "docker-for-frontend-developers-a-practical-introduction",
  "getting-started-with-next-js-15-the-complete-guide",
  "git-workflow-strategies-for-development-teams",
  "graphql-vs-rest-when-to-use-each-in-2025",
  "mastering-go-for-web-development-a-practical-introduction",
  "mastering-tailwind-css-from-basics-to-advanced-patterns",
  "postgresql-for-web-developers-a-practical-guide",
  "python-flask-vs-fastapi-building-modern-apis",
  "typescript-generics-explained-with-real-world-examples",
  "web-performance-optimization-a-developer-s-checklist",
];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const k = () => randomUUID().slice(0, 12);
const span = (text, marks = []) => ({ _type: "span", _key: k(), text, marks });

function toPortableText(blocks) {
  const out = [];
  for (const b of blocks) {
    switch (b.t) {
      case "lead":
        out.push({ _type: "lead", _key: k(), text: b.text });
        break;
      case "p":
        out.push({
          _type: "block",
          _key: k(),
          style: "normal",
          markDefs: [],
          children: b.rich
            ? b.rich.map((r) => span(r.text, r.mark ? [r.mark] : []))
            : [span(b.text)],
        });
        break;
      case "h2":
      case "h3":
        out.push({
          _type: "block",
          _key: k(),
          style: b.t,
          markDefs: [],
          children: [span(b.text)],
        });
        break;
      case "code":
        out.push({
          _type: "code",
          _key: k(),
          language: b.language,
          code: b.code,
          ...(b.filename ? { filename: b.filename } : {}),
        });
        break;
      case "callout":
        out.push({ _type: "callout", _key: k(), type: b.calloutType, text: b.text });
        break;
      case "bullet":
        for (const item of b.items) {
          out.push({
            _type: "block",
            _key: k(),
            style: "normal",
            listItem: "bullet",
            level: 1,
            markDefs: [],
            children: [span(item)],
          });
        }
        break;
      case "divider":
        out.push({ _type: "divider", _key: k(), style: "plain" });
        break;
      default:
        throw new Error(`Unknown block type: ${b.t}`);
    }
  }
  return out;
}

async function main() {
  const draftFiles = readdirSync(join(__dirname, "..", "content-drafts")).filter(
    (f) => f.startsWith("draft-") && f.endsWith(".json"),
  );

  console.log(`${APPLY ? "APPLY" : "DRY RUN"} — ${draftFiles.length} refreshes, ${UNPUBLISH_SLUGS.length} unpublishes\n`);

  for (const file of draftFiles) {
    const draft = JSON.parse(
      readFileSync(join(__dirname, "..", "content-drafts", file), "utf8"),
    );
    const doc = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]{_id, title}`,
      { slug: draft.slug },
    );
    if (!doc) {
      console.log(`!! NOT FOUND: ${draft.slug}`);
      continue;
    }
    const content = toPortableText(draft.blocks);
    console.log(
      `refresh ${draft.slug}\n        "${draft.title}" — ${content.length} PT blocks, ${draft.readingTime} min`,
    );
    if (APPLY) {
      await client
        .patch(doc._id)
        .set({
          title: draft.title,
          excerpt: draft.excerpt,
          readingTime: draft.readingTime,
          content,
          author: { _type: "reference", _ref: MILOS_AUTHOR_ID },
        })
        .commit();
    }
  }

  console.log("");
  for (const slug of UNPUBLISH_SLUGS) {
    const doc = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]{_id, title}`,
      { slug },
    );
    if (!doc) {
      console.log(`!! NOT FOUND (unpublish): ${slug}`);
      continue;
    }
    console.log(`unpublish ${slug}`);
    if (APPLY) {
      await client.patch(doc._id).set({ status: "draft" }).commit();
    }
  }

  const remaining = await client.fetch(
    `count(*[_type == "post" && status == "published"])`,
  );
  console.log(`\npublished posts now: ${remaining}${APPLY ? "" : " (unchanged — dry run)"}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

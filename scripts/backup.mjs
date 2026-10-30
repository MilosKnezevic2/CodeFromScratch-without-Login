/**
 * Backs up everything that lives only on this computer or only in Sanity:
 *  - every Sanity document (posts, categories, authors, ...) as one JSON file
 *  - content-drafts/ (the article sources, gitignored in the public repo)
 *  - brand-brain/ itself is the backup repository: it is committed and pushed
 *    to a PRIVATE GitHub repository.
 *
 * brand-brain/ is a separate git repository (its own .git), ignored by the
 * public blog-cms repo. Keeps the last 8 Sanity exports.
 *
 * Run: node scripts/backup.mjs
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.local"), quiet: true });

const brain = join(root, "brand-brain");
const backup = join(brain, "backup");
const KEEP = 8;
const day = new Date().toISOString().slice(0, 10);

if (!existsSync(join(brain, ".git"))) {
  console.error("brand-brain/ is not a git repository yet; initialise it and add the private remote first");
  process.exit(1);
}
mkdirSync(backup, { recursive: true });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const docs = await client.fetch(`*[!(_id in path("_.**"))] | order(_type asc, _id asc)`);
writeFileSync(join(backup, `sanity-${day}.json`), JSON.stringify(docs, null, 2));
console.log(`sanity: ${docs.length} documents exported`);

const exports = readdirSync(backup).filter((f) => /^sanity-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
for (const old of exports.slice(0, Math.max(0, exports.length - KEEP))) rmSync(join(backup, old));

rmSync(join(backup, "content-drafts"), { recursive: true, force: true });
cpSync(join(root, "content-drafts"), join(backup, "content-drafts"), { recursive: true });

// The database has no backup of its own on the free tier; the encrypted dump
// goes into the same private repository (see scripts/backup-db.mjs).
try {
  console.log(execFileSync(process.execPath, [join(root, "scripts", "backup-db.mjs")], { cwd: root, encoding: "utf8" }).trim());
} catch (error) {
  console.error(`database backup failed, continuing with the rest: ${error.message}`);
}

const git = (...args) => execFileSync("git", args, { cwd: brain, encoding: "utf8" }).trim();
git("add", "-A");
if (git("status", "--porcelain") === "") {
  console.log("nothing changed since the last backup");
} else {
  git("commit", "-m", `backup ${day}`);
  console.log(git("push", "origin", "HEAD"));
}
console.log("backup done");

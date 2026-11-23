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
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { syncDrafts } from "./lib/drafts-sync.mjs";

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

const git = (...args) => execFileSync("git", args, { cwd: brain, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function stop(message) {
  console.error(`backup stopped: ${message}`);
  process.exit(1);
}

// A conflict left over from an earlier run blocks every git command with
// "could not write index"; say what it is instead.
const unmergedFiles = () => git("diff", "--name-only", "--diff-filter=U").split(/\r?\n/).filter(Boolean);
const leftover = unmergedFiles();
if (leftover.length) stop(`brand-brain has an unfinished merge in ${leftover.join(", ")}. Resolve it (keep both sides' lines), commit, then run the backup again.`);

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// The scheduled GitHub run sets BACKUP_SKIP_SANITY: when it and this computer
// both wrote sanity-<day>.json on the same day, the pull before the commit
// collided on that file and the backup stopped (2026-11-18). This computer
// keeps taking the export; the scheduled run only adds drafts and notes.
if (process.env.BACKUP_SKIP_SANITY) {
  console.log("sanity: skipped (BACKUP_SKIP_SANITY)");
} else {
  const docs = await client.fetch(`*[!(_id in path("_.**"))] | order(_type asc, _id asc)`);
  writeFileSync(join(backup, `sanity-${day}.json`), JSON.stringify(docs, null, 2));
  console.log(`sanity: ${docs.length} documents exported`);

  const exports = readdirSync(backup).filter((f) => /^sanity-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  for (const old of exports.slice(0, Math.max(0, exports.length - KEEP))) rmSync(join(backup, old));
}

/** Commits everything in brand-brain, the notes other sessions left uncommitted included. */
function commitAll() {
  git("add", "-A");
  if (git("status", "--porcelain") !== "") git("commit", "-m", `backup ${day}`);
}

/**
 * Takes the commits the scheduled GitHub run pushed. STATE.md merges by
 * keeping both sides' lines (.gitattributes in brand-brain), so notes added
 * here and there at the same time no longer collide (2026-11-21). Any other
 * conflict puts the repository back as it was and stops, rather than leaving
 * a half-merged file behind.
 */
function pullOrStop() {
  try {
    git("pull", "--rebase", "origin", "HEAD");
  } catch (error) {
    const files = unmergedFiles();
    try {
      git("rebase", "--abort");
    } catch {
      // Nothing to abort: the pull failed before the rebase began (no network, for example).
    }
    stop(files.length ? `the private repository changed the same lines in ${files.join(", ")}; nothing was lost, the local commit is kept. Merge by hand, then run the backup again.` : `could not pull: ${String(error.stderr || error.message).trim()}`);
  }
}

// Local notes are committed before the pull, so the pull never stashes them
// (a stash that did not pop back cleanly stopped the backup on 2026-11-21).
// Drafts are written both here and by the scheduled GitHub run: after the
// pull they sync both ways instead of mirroring.
commitAll();
pullOrStop();
const synced = syncDrafts(root);
console.log(`drafts: ${synced.toBackup.length} backed up, ${synced.toLocal.length} brought here from the private repo`);

// The database has no backup of its own on the free tier; the encrypted dump
// goes into the same private repository (see scripts/backup-db.mjs).
// The GitHub Actions cycle (cfs-brand-private) has no database credentials on
// purpose and sets BACKUP_SKIP_DB; the local backups keep taking the dump.
if (process.env.BACKUP_SKIP_DB) {
  console.log("database: skipped (BACKUP_SKIP_DB)");
} else {
  try {
    console.log(execFileSync(process.execPath, [join(root, "scripts", "backup-db.mjs")], { cwd: root, encoding: "utf8" }).trim());
  } catch (error) {
    console.error(`database backup failed, continuing with the rest: ${error.message}`);
  }
}

commitAll();
// Commits not on the private repository yet; needs no upstream setting, so it works on the GitHub runner too.
if (git("rev-list", "--count", "HEAD", "--not", "--remotes=origin") === "0") {
  console.log("nothing changed since the last backup");
} else {
  // This computer and the GitHub Actions cycle both push here: take the other side's commits first.
  pullOrStop();
  git("push", "origin", "HEAD");
  console.log("pushed to the private repository");
}
console.log("backup done");

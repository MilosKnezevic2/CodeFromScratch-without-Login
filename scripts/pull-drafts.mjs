/**
 * Brings the drafts written by the scheduled GitHub run (private repository
 * cfs-brand-private) to this computer before reviewing or publishing: pulls
 * brand-brain/, then syncs content-drafts/ both ways (see lib/drafts-sync.mjs).
 * Local-only drafts are not pushed here; the next backup does that.
 *
 * Run: node scripts/pull-drafts.mjs
 */
import { execFileSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { syncDrafts } from "./lib/drafts-sync.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
console.log(execFileSync("git", ["pull", "--rebase", "origin", "HEAD"], { cwd: join(root, "brand-brain"), encoding: "utf8" }).trim());
const { toLocal } = syncDrafts(root);
for (const name of toLocal) console.log(`  ${name}`);
console.log(toLocal.length ? `${toLocal.length} draft file(s) brought over` : "drafts already up to date");

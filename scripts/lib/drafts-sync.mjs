/**
 * Two-way sync between content-drafts/ (gitignored, on this computer or on
 * the GitHub Actions runner) and brand-brain/backup/content-drafts/ (the
 * private repository). Both this computer and the scheduled GitHub run write
 * drafts, so neither side may simply mirror itself over the other.
 *
 * Rules: a file that exists on one side only is copied to the other; a file
 * whose content differs goes in the direction of the newer edit, comparing
 * the local file's modification time with the time of the last private-repo
 * commit that touched the backup copy. Nothing is ever deleted.
 */
import { execFileSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const files = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => statSync(join(dir, n)).isFile()) : []);

/** Last commit time (ms) of a file in the private repository, 0 when it was never committed. */
function committedAt(brain, relPath) {
  const out = execFileSync("git", ["log", "-1", "--format=%ct", "--", relPath], { cwd: brain, encoding: "utf8" }).trim();
  return out ? Number(out) * 1000 : 0;
}

/** @returns {{ toBackup: string[], toLocal: string[] }} the file names copied in each direction */
export function syncDrafts(root) {
  const local = join(root, "content-drafts");
  const brain = join(root, "brand-brain");
  const backup = join(brain, "backup", "content-drafts");
  mkdirSync(local, { recursive: true });
  mkdirSync(backup, { recursive: true });
  const toBackup = [];
  const toLocal = [];
  for (const name of new Set([...files(local), ...files(backup)])) {
    const l = join(local, name);
    const b = join(backup, name);
    if (!existsSync(b)) {
      copyFileSync(l, b);
      toBackup.push(name);
    } else if (!existsSync(l)) {
      copyFileSync(b, l);
      toLocal.push(name);
    } else if (!readFileSync(l).equals(readFileSync(b))) {
      const backupTime = committedAt(brain, `backup/content-drafts/${name}`);
      if (backupTime > statSync(l).mtimeMs) {
        copyFileSync(b, l);
        toLocal.push(name);
      } else {
        copyFileSync(l, b);
        toBackup.push(name);
      }
    }
  }
  return { toBackup, toLocal };
}

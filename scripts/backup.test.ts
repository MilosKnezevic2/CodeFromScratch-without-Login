import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

/**
 * The backup against two throwaway clones of one repository: the scheduled
 * GitHub run on one side, this computer on the other. On 2026-11-21 both
 * added a line at the end of STATE.md and the backup stopped half-merged.
 */
const repoRoot = resolve(__dirname, "..");
const dirs: string[] = [];

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function setup({ union }: { union: boolean }) {
  const base = mkdtempSync(join(tmpdir(), "cfs-backup-"));
  dirs.push(base);
  const remote = join(base, "remote.git");
  git(base, "init", "-q", "--bare", "-b", "main", remote);

  const clone = (dir: string) => {
    git(base, "clone", "-q", "-c", "core.autocrlf=false", remote, dir);
    git(dir, "config", "user.name", "test");
    git(dir, "config", "user.email", "test@example.com");
    return dir;
  };
  const seed = clone(join(base, "seed"));
  writeFileSync(join(seed, "STATE.md"), "# STATE\n\n## Log\n- line one\n");
  writeFileSync(join(seed, ".gitattributes"), `backup/** -text\n${union ? "STATE.md merge=union\n" : ""}`);
  git(seed, "add", "-A");
  git(seed, "commit", "-qm", "base");
  git(seed, "push", "-q", "origin", "main");

  const root = join(base, "root");
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "content-drafts"));
  copyFileSync(join(repoRoot, "scripts", "backup.mjs"), join(root, "scripts", "backup.mjs"));
  cpSync(join(repoRoot, "scripts", "lib"), join(root, "scripts", "lib"), { recursive: true });
  symlinkSync(join(repoRoot, "node_modules"), join(root, "node_modules"), "junction");
  const brain = clone(join(root, "brand-brain"));
  const cycle = clone(join(base, "cycle"));
  return { root, brain, cycle };
}

function runBackup(root: string) {
  const r = spawnSync(process.execPath, [join(root, "scripts", "backup.mjs")], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NEXT_PUBLIC_SANITY_PROJECT_ID: "test", BACKUP_SKIP_SANITY: "1", BACKUP_SKIP_DB: "1" },
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

/** The scheduled run pushes a note while a local session leaves one uncommitted, both at the end of STATE.md. */
function bothAddANote(brain: string, cycle: string) {
  appendFileSync(join(cycle, "STATE.md"), "- cycle: article 11 ready\n");
  git(cycle, "commit", "-qam", "cycle");
  git(cycle, "push", "-q", "origin", "main");
  appendFileSync(join(brain, "STATE.md"), "- seo: plan C proposal\n");
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("backup.mjs and the private repository", () => {
  it("keeps both notes when both sides added to STATE.md, and pushes", () => {
    const { root, brain, cycle } = setup({ union: true });
    bothAddANote(brain, cycle);
    const { code, out } = runBackup(root);
    expect(out).toContain("backup done");
    expect(code).toBe(0);
    const state = readFileSync(join(brain, "STATE.md"), "utf8");
    expect(state).toContain("- cycle: article 11 ready");
    expect(state).toContain("- seo: plan C proposal");
    expect(state).not.toContain("<<<<<<<");
    git(cycle, "pull", "-q", "origin", "main");
    expect(readFileSync(join(cycle, "STATE.md"), "utf8")).toContain("- seo: plan C proposal");
  }, 60_000);

  it("stops cleanly on a conflict it cannot settle: no half-merged file, the local note kept", () => {
    const { root, brain, cycle } = setup({ union: false });
    bothAddANote(brain, cycle);
    const first = runBackup(root);
    expect(first.code).toBe(1);
    expect(first.out).toContain("changed the same lines in STATE.md");
    expect(git(brain, "diff", "--name-only", "--diff-filter=U")).toBe("");
    expect(git(brain, "log", "-1", "-p")).toContain("+- seo: plan C proposal");
    // Running it again says the same thing instead of "could not write index".
    expect(runBackup(root).out).toContain("changed the same lines in STATE.md");
  }, 60_000);

  it("says so when there is nothing new", () => {
    const { root } = setup({ union: true });
    const { code, out } = runBackup(root);
    expect(code).toBe(0);
    expect(out).toContain("nothing changed since the last backup");
  }, 60_000);
});

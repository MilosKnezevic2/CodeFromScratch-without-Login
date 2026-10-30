/**
 * Encrypted backup of the production database tables that exist nowhere else:
 * subscribers, the waitlist, contact messages, settings, the admin account,
 * the activity log, the analytics counters and the user tables.
 *
 * Supabase Free keeps no backups of its own. This writes one encrypted file
 * per run into brand-brain/backup/db/ (the private brand repository), keeps
 * the last 8, and is called by scripts/backup.mjs every Monday.
 *
 * The passphrase lives in .secrets/backup-key (git-ignored) and is created on
 * the first run. Without it the files are unreadable, so the operator keeps a
 * copy of that key in his password manager.
 *
 * Run:      node scripts/backup-db.mjs
 * Restore:  node scripts/backup-db.mjs --decrypt <file.enc> <out.json>
 */
import "dotenv/config";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const keyPath = join(root, ".secrets", "backup-key");
const outDir = join(root, "brand-brain", "backup", "db");
const KEEP = 8;
const TABLES = [
  "NewsletterSubscriber",
  "CourseWaitlist",
  "ContactSubmission",
  "SiteSetting",
  "AdminAccount",
  "AdminAuditLog",
  "AnalyticsCounter",
  "SearchStat",
  "User",
  "Account",
  "Subscription",
  "Ebook",
  "EbookPurchase",
  "SavedPost",
  "Collection",
  "SavedPostCollection",
  "PostReaction",
  "ReadingHistory",
  "NewsletterCampaign",
  "EmailSequenceStatus",
];

function passphrase() {
  if (!existsSync(keyPath)) {
    mkdirSync(dirname(keyPath), { recursive: true });
    writeFileSync(keyPath, randomBytes(32).toString("hex"), { mode: 0o600 });
    console.log("created .secrets/backup-key: copy it into the password manager, the backups are unreadable without it");
  }
  return readFileSync(keyPath, "utf8").trim();
}

function encrypt(plaintext) {
  const salt = randomBytes(16);
  const key = scryptSync(passphrase(), salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return JSON.stringify({ v: 1, salt: salt.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") });
}

function decrypt(text) {
  const { salt, iv, tag, data } = JSON.parse(text);
  const key = scryptSync(passphrase(), Buffer.from(salt, "base64"), 32);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

if (process.argv[2] === "--decrypt") {
  const [, , , input, output] = process.argv;
  if (!input || !output) {
    console.error("usage: node scripts/backup-db.mjs --decrypt <file.enc> <out.json>");
    process.exit(2);
  }
  writeFileSync(output, decrypt(readFileSync(input, "utf8")));
  console.log(`decrypted to ${output}; delete it when done, it holds personal data`);
  process.exit(0);
}

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslmode");
if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "5432") url.port = "6543";
const client = new pg.Client({
  connectionString: url.toString(),
  ssl: url.hostname === "localhost" ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

try {
  await client.connect();
  await client.query("SET default_transaction_read_only = on");
  const dump = { takenAt: new Date().toISOString(), tables: {} };
  let rows = 0;
  for (const table of TABLES) {
    const exists = (await client.query("SELECT to_regclass($1) AS t", [`public."${table}"`])).rows[0].t;
    if (!exists) continue;
    const limit = table === "AdminAuditLog" ? ' ORDER BY "createdAt" DESC LIMIT 2000' : "";
    const result = await client.query(`SELECT * FROM "${table}"${limit}`);
    dump.tables[table] = result.rows;
    rows += result.rows.length;
  }
  mkdirSync(outDir, { recursive: true });
  const day = dump.takenAt.slice(0, 10);
  const file = join(outDir, `db-${day}.json.enc`);
  writeFileSync(file, encrypt(JSON.stringify(dump)));
  const files = readdirSync(outDir).filter((f) => /^db-\d{4}-\d{2}-\d{2}\.json\.enc$/.test(f)).sort();
  for (const old of files.slice(0, Math.max(0, files.length - KEEP))) rmSync(join(outDir, old));
  // Prove the file can be read back before calling it a backup.
  const check = JSON.parse(decrypt(readFileSync(file, "utf8")));
  const checkRows = Object.values(check.tables).reduce((n, t) => n + t.length, 0);
  if (checkRows !== rows) throw new Error(`read-back mismatch: ${checkRows} of ${rows} rows`);
  console.log(`database backup ok: ${Object.keys(dump.tables).length} tables, ${rows} rows, ${file.replace(root, "").replace(/\\/g, "/")}`);
} catch (error) {
  console.error("backup-db failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

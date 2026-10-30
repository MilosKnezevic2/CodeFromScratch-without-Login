/**
 * Prints how many people confirmed a place on the course waitlist, split by
 * level. Counts only: no email addresses or notes are printed.
 *
 * Run: node scripts/waitlist-count.mjs
 */

import "dotenv/config";
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

try {
  await client.connect();
  const { rows } = await client.query(
    `select level, count(*)::int as n from "CourseWaitlist" where confirmed group by level order by level`,
  );
  const total = rows.reduce((sum, r) => sum + r.n, 0);
  console.log(`Course waitlist (confirmed): ${total}`);
  for (const r of rows) console.log(`  ${r.level}: ${r.n}`);
} catch (error) {
  console.error("waitlist-count failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

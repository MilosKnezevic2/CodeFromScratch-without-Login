/**
 * A plain load test against the live site: N readers at once, for D seconds,
 * each requesting the public pages in a loop, while a database-backed route
 * is probed every few seconds so a starved database shows up as a failure.
 *
 * No writes: the probe is an unsubscribe with a token that does not exist,
 * which answers 200 {"status":"invalid"} only when the database answered.
 *
 * Run: node scripts/load-test.mjs [readers=30] [seconds=45] [base=https://codefromscratch.org]
 */
const readers = Number(process.argv[2] ?? 30);
const seconds = Number(process.argv[3] ?? 45);
const base = process.argv[4] ?? "https://codefromscratch.org";
const PAGES = ["/", "/blog", "/blog/what-is-web-development-beginners-guide", "/blog/zod-at-trust-boundaries", "/newsletter", "/blog/category/databases"];
const UA = "Mozilla/5.0 (load test; codefromscratch.org operator) Chrome/120";

const latencies = [];
const statuses = new Map();
const probes = [];
let bytes = 0;
const end = Date.now() + seconds * 1000;

async function reader(id) {
  let i = id;
  while (Date.now() < end) {
    const path = PAGES[i++ % PAGES.length];
    const started = performance.now();
    try {
      const res = await fetch(base + path, { headers: { "user-agent": UA } });
      const body = await res.arrayBuffer();
      bytes += body.byteLength;
      statuses.set(res.status, (statuses.get(res.status) ?? 0) + 1);
    } catch {
      statuses.set("error", (statuses.get("error") ?? 0) + 1);
    }
    latencies.push(performance.now() - started);
  }
}

async function probe() {
  while (Date.now() < end) {
    const started = performance.now();
    try {
      const res = await fetch(`${base}/api/newsletter/unsubscribe`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: base, "user-agent": UA },
        body: JSON.stringify({ token: "load-test-no-such-token" }),
      });
      const body = await res.json().catch(() => ({}));
      probes.push({ ok: res.status === 200 && body.status === "invalid", status: res.status, ms: Math.round(performance.now() - started) });
    } catch {
      probes.push({ ok: false, status: "error", ms: Math.round(performance.now() - started) });
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

const pct = (p) => {
  const sorted = [...latencies].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0);
};

console.log(`${readers} readers for ${seconds}s against ${base}`);
await Promise.all([...Array.from({ length: readers }, (_, i) => reader(i)), probe()]);

const total = latencies.length;
console.log(`requests: ${total} (${(total / seconds).toFixed(1)}/s), ${(bytes / 1024 / 1024).toFixed(1)} MiB`);
console.log(`latency ms: p50 ${pct(50)}, p95 ${pct(95)}, p99 ${pct(99)}, max ${pct(100)}`);
console.log(`statuses: ${[...statuses.entries()].map(([k, v]) => `${k}=${v}`).join(", ")}`);
const failedProbes = probes.filter((p) => !p.ok);
console.log(`database probes: ${probes.length}, failed ${failedProbes.length}, slowest ${Math.max(...probes.map((p) => p.ms))} ms`);
if (failedProbes.length) console.log("  failures:", JSON.stringify(failedProbes.slice(0, 5)));
process.exitCode = failedProbes.length || (statuses.get("error") ?? 0) || [...statuses.keys()].some((k) => typeof k === "number" && k >= 500) ? 1 : 0;

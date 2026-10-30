const SESSION_PORT = "5432";
const TRANSACTION_PORT = "6543";

/**
 * Supabase's pooler has two modes on one host. Session mode (5432) gives every
 * client its own database connection until that client disconnects, and only
 * 15 fit; a frozen serverless instance keeps its share for minutes, so a burst
 * of visits could fail reader sign-ups. Transaction mode (6543) borrows a
 * connection per query and queues the rest, which is what serverless needs.
 *
 * Applied in code so the running site cannot drift back through an environment
 * setting. Any other host, such as a local database, is left alone.
 */
export function toTransactionPooler(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".pooler.supabase.com") || parsed.port !== SESSION_PORT) return url;
    parsed.port = TRANSACTION_PORT;
    return parsed.toString();
  } catch {
    // Not parseable here: let pg report the bad address with its own clear error.
    return url;
  }
}

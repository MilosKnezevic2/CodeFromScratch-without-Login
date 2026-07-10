/**
 * Origin check for mutating API requests, used by the Edge proxy.
 *
 * A request is trusted when it has no Origin header (server-to-server
 * callers, curl, same-origin GET navigations) or when the Origin matches
 * either the deployment itself (covers preview URLs, which don't know
 * NEXT_PUBLIC_SITE_URL) or the configured public site URL. Comparison is
 * done on parsed URL origins so trailing slashes or paths in the env var
 * can't lock legitimate browsers out.
 */
export function isTrustedOrigin(
  originHeader: string | null,
  requestUrl: string,
  siteUrl: string | undefined,
): boolean {
  if (!originHeader) return true;

  let origin: string;
  try {
    origin = new URL(originHeader).origin;
  } catch {
    // Malformed Origin header — not a browser we can trust.
    return false;
  }

  try {
    if (origin === new URL(requestUrl).origin) return true;
  } catch {
    // requestUrl comes from the runtime and should always parse; if it
    // doesn't, fall through to the configured-site check.
  }

  if (siteUrl) {
    try {
      if (origin === new URL(siteUrl).origin) return true;
    } catch {
      // Misconfigured NEXT_PUBLIC_SITE_URL — ignore it rather than fail open.
    }
  }

  return false;
}

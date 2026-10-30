/**
 * Read-only Search Console client shared by the report and the daily sync.
 * No dependencies: the service-account JWT is signed with node:crypto.
 * Key file: .secrets/gsc-key.json (git-ignored).
 */

import { createSign } from "crypto";
import { existsSync, readFileSync } from "fs";

export const SITE = "sc-domain:codefromscratch.org";

const b64 = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64({ alg: "RS256", typ: "JWT" });
  const claims = b64({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(key.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`token request failed: ${JSON.stringify(body)}`);
  return body.access_token;
}

/** A bearer token for any Search Console endpoint, or exits with code 2 when the key file is missing. */
export async function gscToken(keyPath) {
  if (!existsSync(keyPath)) {
    console.error("missing .secrets/gsc-key.json");
    process.exit(2);
  }
  return accessToken(JSON.parse(readFileSync(keyPath, "utf8")));
}

/** Returns an authenticated API caller, or exits with code 2 when the key file is missing. */
export async function gscApi(keyPath) {
  if (!existsSync(keyPath)) {
    console.error("missing .secrets/gsc-key.json");
    process.exit(2);
  }
  const token = await accessToken(JSON.parse(readFileSync(keyPath, "utf8")));
  return (path, init = {}) =>
    fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}${path}`, {
      ...init,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    }).then(async (r) => {
      const body = await r.json();
      if (!r.ok) throw new Error(`${path}: ${r.status} ${JSON.stringify(body.error ?? body)}`);
      return body;
    });
}

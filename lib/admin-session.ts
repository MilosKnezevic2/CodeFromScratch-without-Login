const DEFAULT_TTL_MS = 60 * 60 * 24 * 1000;

type Payload = {
  sub: "admin";
  iat: number;
  exp: number;
};

function base64urlEncode(bytes: Uint8Array | string): string {
  const buf = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  let binary = "";
  for (const byte of buf) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "NEXTAUTH_SECRET (or AUTH_SECRET) must be set and be at least 32 characters for admin session signing.",
    );
  }
  return secret;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(payloadEncoded: string, secret: string): Promise<string> {
  const key = await getKey(secret);
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadEncoded),
  );
  return base64urlEncode(new Uint8Array(signatureBytes));
}

function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function isPayload(value: unknown): value is Payload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.sub === "admin" &&
    typeof v.iat === "number" &&
    typeof v.exp === "number" &&
    Number.isFinite(v.iat) &&
    Number.isFinite(v.exp)
  );
}

export async function createAdminSession(ttlMs: number = DEFAULT_TTL_MS): Promise<string> {
  const now = Date.now();
  const payload: Payload = { sub: "admin", iat: now, exp: now + ttlMs };
  const payloadEncoded = base64urlEncode(JSON.stringify(payload));
  const signature = await sign(payloadEncoded, getSecret());
  return `${payloadEncoded}.${signature}`;
}

export async function verifyAdminSession(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;

  const payloadEncoded = token.slice(0, dot);
  const signatureEncoded = token.slice(dot + 1);

  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return false;
  }

  const expected = await sign(payloadEncoded, secret);
  const expectedBytes = new TextEncoder().encode(expected);
  const receivedBytes = new TextEncoder().encode(signatureEncoded);
  if (!constantTimeEquals(expectedBytes, receivedBytes)) return false;

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadEncoded)));
  } catch {
    return false;
  }

  if (!isPayload(payload)) return false;
  if (payload.exp <= Date.now()) return false;
  return true;
}

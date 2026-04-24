import { beforeEach, describe, expect, it } from "vitest";
import { createAdminSession, verifyAdminSession } from "./admin-session";

const STRONG_SECRET = "a".repeat(48);

describe("admin-session", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = STRONG_SECRET;
  });

  it("accepts a freshly issued token", async () => {
    const token = await createAdminSession();
    await expect(verifyAdminSession(token)).resolves.toBe(true);
  });

  it("rejects the legacy bypass literal", async () => {
    await expect(verifyAdminSession("authenticated")).resolves.toBe(false);
  });

  it("rejects missing, empty, and malformed inputs", async () => {
    await expect(verifyAdminSession(undefined)).resolves.toBe(false);
    await expect(verifyAdminSession(null)).resolves.toBe(false);
    await expect(verifyAdminSession("")).resolves.toBe(false);
    await expect(verifyAdminSession("no-dot-here")).resolves.toBe(false);
    await expect(verifyAdminSession(".")).resolves.toBe(false);
    await expect(verifyAdminSession("payload.")).resolves.toBe(false);
    await expect(verifyAdminSession(".signature")).resolves.toBe(false);
  });

  it("rejects tokens signed with a different secret", async () => {
    process.env.NEXTAUTH_SECRET = STRONG_SECRET;
    const token = await createAdminSession();
    process.env.NEXTAUTH_SECRET = "b".repeat(48);
    await expect(verifyAdminSession(token)).resolves.toBe(false);
  });

  it("rejects tokens with a tampered payload", async () => {
    const token = await createAdminSession();
    const [, signature] = token.split(".");
    const tampered = `${Buffer.from(JSON.stringify({ sub: "admin", iat: 0, exp: Date.now() + 60_000 })).toString("base64url")}.${signature}`;
    await expect(verifyAdminSession(tampered)).resolves.toBe(false);
  });

  it("rejects expired tokens", async () => {
    const token = await createAdminSession(-1);
    await expect(verifyAdminSession(token)).resolves.toBe(false);
  });

  it("rejects when secret is missing or too short", async () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    await expect(verifyAdminSession("any.thing")).resolves.toBe(false);
    await expect(createAdminSession()).rejects.toThrow(/NEXTAUTH_SECRET/);

    process.env.NEXTAUTH_SECRET = "short";
    await expect(createAdminSession()).rejects.toThrow(/at least 32/);
  });

  it("accepts AUTH_SECRET as a fallback", async () => {
    delete process.env.NEXTAUTH_SECRET;
    process.env.AUTH_SECRET = STRONG_SECRET;
    const token = await createAdminSession();
    await expect(verifyAdminSession(token)).resolves.toBe(true);
  });
});

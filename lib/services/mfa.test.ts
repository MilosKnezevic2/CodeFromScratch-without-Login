import { beforeEach, describe, expect, it } from "vitest";
import { generateSync } from "otplib";
import {
  consumeBackupCode,
  createEnrolment,
  decryptSecret,
  encryptSecret,
  formatBackupCode,
  safeEqual,
  verifyTotpCode,
} from "./mfa";

const STRONG_SECRET = "a".repeat(48);

describe("mfa service", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = STRONG_SECRET;
  });

  describe("encryptSecret / decryptSecret", () => {
    it("round-trips a value", () => {
      const original = "JBSWY3DPEHPK3PXP";
      const encrypted = encryptSecret(original);
      expect(encrypted).not.toBe(original);
      expect(decryptSecret(encrypted)).toBe(original);
    });

    it("produces different ciphertext for the same input (random IV)", () => {
      const a = encryptSecret("same");
      const b = encryptSecret("same");
      expect(a).not.toBe(b);
    });

    it("rejects tampered payload", () => {
      const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");
      const [iv, tag, data] = encrypted.split(".");
      // Mutate the first byte of the ciphertext so AES-GCM auth tag
      // verification fails on decrypt. Appending a char alone is not
      // enough — base64 may silently tolerate trailing chars.
      const dataBuf = Buffer.from(data!, "base64");
      dataBuf[0] = dataBuf[0]! ^ 0xff;
      const tampered = `${iv}.${tag}.${dataBuf.toString("base64")}`;
      expect(() => decryptSecret(tampered)).toThrow();
    });

    it("rejects payload encrypted with a different secret", () => {
      const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");
      process.env.NEXTAUTH_SECRET = "b".repeat(48);
      expect(() => decryptSecret(encrypted)).toThrow();
    });

    it("throws when secret is missing", () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.AUTH_SECRET;
      expect(() => encryptSecret("anything")).toThrow(/NEXTAUTH_SECRET/);
    });
  });

  describe("createEnrolment", () => {
    it("produces a usable enrolment bundle", async () => {
      const bundle = await createEnrolment("user@example.com");
      expect(bundle.otpauthUri).toMatch(/^otpauth:\/\/totp\//);
      expect(bundle.otpauthUri).toContain("CodeFromScratch");
      expect(bundle.otpauthUri).toContain("user%40example.com");
      expect(bundle.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(bundle.backupCodesPlain).toHaveLength(10);
      expect(bundle.backupCodesHashed).toHaveLength(10);
      for (const code of bundle.backupCodesPlain) {
        expect(code).toMatch(/^[0-9A-F]{10}$/);
      }
    });

    it("backup codes are unique", async () => {
      const { backupCodesPlain } = await createEnrolment("user@example.com");
      const set = new Set(backupCodesPlain);
      expect(set.size).toBe(backupCodesPlain.length);
    });
  });

  describe("verifyTotpCode", () => {
    it("accepts a fresh code generated with the same secret", async () => {
      const bundle = await createEnrolment("user@example.com");
      const decryptedSecret = decryptSecret(bundle.encryptedSecret);
      const currentCode = generateSync({ secret: decryptedSecret });
      expect(verifyTotpCode(bundle.encryptedSecret, currentCode)).toBe(true);
    });

    it("rejects malformed codes", () => {
      const bundle = "aaa.bbb.ccc";
      expect(verifyTotpCode(bundle, "abc123")).toBe(false);
      expect(verifyTotpCode(bundle, "12345")).toBe(false);
      expect(verifyTotpCode(bundle, "1234567")).toBe(false);
      expect(verifyTotpCode(bundle, "")).toBe(false);
    });

    it("rejects codes against an unrelated secret", async () => {
      const bundleA = await createEnrolment("a@example.com");
      const bundleB = await createEnrolment("b@example.com");
      const secretA = decryptSecret(bundleA.encryptedSecret);
      const codeFromA = generateSync({ secret: secretA });
      expect(verifyTotpCode(bundleB.encryptedSecret, codeFromA)).toBe(false);
    });

    it("returns false for malformed encrypted payload", () => {
      expect(verifyTotpCode("not-a-real-payload", "123456")).toBe(false);
    });
  });

  describe("consumeBackupCode", () => {
    it("accepts a valid code and removes it from the array", async () => {
      const bundle = await createEnrolment("user@example.com");
      const firstCode = bundle.backupCodesPlain[0]!;
      const remaining = await consumeBackupCode(firstCode, bundle.backupCodesHashed);
      expect(remaining).not.toBeNull();
      expect(remaining).toHaveLength(9);
    });

    it("rejects a code that doesn't match", async () => {
      const bundle = await createEnrolment("user@example.com");
      const fake = "1234567890";
      const result = await consumeBackupCode(fake, bundle.backupCodesHashed);
      expect(result).toBeNull();
    });

    it("normalises case and trims whitespace", async () => {
      const bundle = await createEnrolment("user@example.com");
      const firstCode = bundle.backupCodesPlain[0]!;
      const messy = `  ${firstCode.toLowerCase()}  `;
      const remaining = await consumeBackupCode(messy, bundle.backupCodesHashed);
      expect(remaining).not.toBeNull();
    });

    it("rejects malformed codes (non-hex, wrong length)", async () => {
      const bundle = await createEnrolment("user@example.com");
      await expect(
        consumeBackupCode("notahex", bundle.backupCodesHashed),
      ).resolves.toBeNull();
      await expect(
        consumeBackupCode("0123456789ABCDEF", bundle.backupCodesHashed),
      ).resolves.toBeNull();
      await expect(consumeBackupCode("", bundle.backupCodesHashed)).resolves.toBeNull();
    });

    it("single-use: the same code cannot be consumed twice", async () => {
      const bundle = await createEnrolment("user@example.com");
      const firstCode = bundle.backupCodesPlain[0]!;
      const afterFirst = await consumeBackupCode(firstCode, bundle.backupCodesHashed);
      expect(afterFirst).not.toBeNull();
      const afterSecond = await consumeBackupCode(firstCode, afterFirst!);
      expect(afterSecond).toBeNull();
    });
  });

  describe("formatBackupCode", () => {
    it("splits with a dash", () => {
      expect(formatBackupCode("ABCDE12345")).toBe("ABCDE-12345");
    });
  });

  describe("safeEqual", () => {
    it("returns true for equal strings", () => {
      expect(safeEqual("abc", "abc")).toBe(true);
    });
    it("returns false for different strings", () => {
      expect(safeEqual("abc", "abd")).toBe(false);
    });
    it("returns false for different lengths", () => {
      expect(safeEqual("abc", "abcd")).toBe(false);
    });
  });
});

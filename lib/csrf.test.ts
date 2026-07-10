import { describe, it, expect } from "vitest";
import { isTrustedOrigin } from "./csrf";

const REQUEST_URL = "https://preview-abc.vercel.app/api/contact";
const SITE_URL = "https://codefromscratch.org";

describe("isTrustedOrigin", () => {
  it("trusts requests without an Origin header (server-to-server, curl)", () => {
    expect(isTrustedOrigin(null, REQUEST_URL, SITE_URL)).toBe(true);
  });

  it("trusts the deployment's own origin (previews included)", () => {
    expect(
      isTrustedOrigin("https://preview-abc.vercel.app", REQUEST_URL, SITE_URL),
    ).toBe(true);
  });

  it("trusts the configured public site URL", () => {
    expect(isTrustedOrigin(SITE_URL, REQUEST_URL, SITE_URL)).toBe(true);
  });

  it("tolerates a trailing slash or path in NEXT_PUBLIC_SITE_URL", () => {
    // The old string-equality check 403'd every legitimate browser when the
    // env var carried a trailing slash — regression guard for that.
    expect(isTrustedOrigin(SITE_URL, REQUEST_URL, `${SITE_URL}/`)).toBe(true);
    expect(isTrustedOrigin(SITE_URL, REQUEST_URL, `${SITE_URL}/blog`)).toBe(true);
  });

  it("rejects a foreign origin", () => {
    expect(isTrustedOrigin("https://evil.example", REQUEST_URL, SITE_URL)).toBe(false);
  });

  it("rejects a foreign origin even when NEXT_PUBLIC_SITE_URL is unset", () => {
    // The old check silently skipped CSRF entirely without the env var.
    expect(isTrustedOrigin("https://evil.example", REQUEST_URL, undefined)).toBe(false);
  });

  it("still trusts the request's own origin when NEXT_PUBLIC_SITE_URL is unset", () => {
    expect(
      isTrustedOrigin("https://preview-abc.vercel.app", REQUEST_URL, undefined),
    ).toBe(true);
  });

  it("rejects a malformed Origin header", () => {
    expect(isTrustedOrigin("not a url", REQUEST_URL, SITE_URL)).toBe(false);
  });

  it("ignores a malformed NEXT_PUBLIC_SITE_URL instead of failing open", () => {
    expect(isTrustedOrigin("https://evil.example", REQUEST_URL, "not a url")).toBe(false);
  });

  it("compares full origins, not prefixes", () => {
    expect(
      isTrustedOrigin("https://codefromscratch.org.evil.example", REQUEST_URL, SITE_URL),
    ).toBe(false);
  });
});

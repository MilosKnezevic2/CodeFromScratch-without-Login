import { describe, expect, it } from "vitest";
import { normalizeEmail, signInLinkEmail } from "./email-sign-in";

describe("normalizeEmail", () => {
  it("accepts any provider and lowercases", () => {
    for (const e of ["Emily@GMX.at", "james@yahoo.com", "olivia@hotmail.com", "me@my-own-domain.dev"]) {
      expect(normalizeEmail(`  ${e} `)).toBe(e.toLowerCase());
    }
  });

  it("refuses what is not an address", () => {
    expect(() => normalizeEmail("not-an-email")).toThrow();
    expect(() => normalizeEmail(`${"a".repeat(250)}@x.io`)).toThrow();
  });
});

describe("signInLinkEmail", () => {
  it("escapes the link in the HTML and keeps it intact in the text", () => {
    const url = 'https://codefromscratch.org/api/auth/callback/resend?token=a"b&email=x';
    const mail = signInLinkEmail(url);
    expect(mail.html).toContain("token=a&quot;b&amp;email=x");
    expect(mail.text).toContain(url);
  });
});

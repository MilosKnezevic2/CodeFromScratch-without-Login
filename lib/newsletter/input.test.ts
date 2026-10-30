import { describe, it, expect } from "vitest";
import { NOTE_MAX, SUBJECT_MAX, isValidEmail, parseLetterInput } from "./input";

describe("parseLetterInput", () => {
  it("accepts an article letter and trims it", () => {
    const parsed = parseLetterInput({ subject: "  Hi  ", postSlug: "flex-vs-grid" });
    expect(parsed).toEqual({
      ok: true,
      value: { subject: "Hi", preheader: "", note: "", postSlug: "flex-vs-grid" },
    });
  });

  it("accepts a note without an article", () => {
    expect(parseLetterInput({ subject: "Hi", note: "Hello" }).ok).toBe(true);
  });

  it.each([
    ["no body", null],
    ["no subject", { note: "x" }],
    ["nothing to send", { subject: "Hi" }],
    ["a subject that is too long", { subject: "x".repeat(SUBJECT_MAX + 1), note: "x" }],
    ["a note that is too long", { subject: "Hi", note: "x".repeat(NOTE_MAX + 1) }],
    ["header injection through the subject", { subject: "Hi\r\nBcc: a@b.co", note: "x" }],
    ["a slug with odd characters", { subject: "Hi", postSlug: "../../etc" }],
  ])("rejects %s", (_name, body) => {
    expect(parseLetterInput(body).ok).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts a normal address and rejects junk", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail(`${"x".repeat(250)}@b.co`)).toBe(false);
  });
});

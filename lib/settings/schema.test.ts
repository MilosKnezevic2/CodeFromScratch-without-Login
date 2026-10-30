import { describe, expect, it } from "vitest";
import { changedFields, DEFAULTS, flatten, fromStored, parseSection, readField, SECTION_INFO, SECTIONS, stripeKeyMode } from "./schema";

const context = { stripeKeyMode: "none" as const };

/** A complete, valid form for a section, built from the defaults. */
function formFor(section: (typeof SECTIONS)[number], overrides: Record<string, string | undefined> = {}) {
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(flatten(DEFAULTS[section]))) {
    if (typeof value === "boolean") {
      if (value) raw[key] = "on";
    } else raw[key] = String(value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete raw[key];
    else raw[key] = value;
  }
  return raw;
}

describe("every field has a default", () => {
  it.each(SECTIONS)("%s", (section) => {
    const defaults = flatten(DEFAULTS[section]);
    for (const field of SECTION_INFO[section].fields) expect(defaults).toHaveProperty(field.name);
  });

  it("round-trips the defaults through a form without errors", () => {
    for (const section of SECTIONS) {
      const { value, errors } = parseSection(section, formFor(section), context);
      expect(errors).toEqual({});
      expect(value).toEqual(DEFAULTS[section]);
    }
  });
});

describe("readField", () => {
  it("treats a missing checkbox as off", () => {
    const field = SECTION_INFO.features.fields[0];
    expect(readField(field, undefined)).toEqual({ value: false });
    expect(readField(field, "on")).toEqual({ value: true });
    expect(readField(field, "yes")).toEqual({ value: false });
  });

  it("refuses bad emails, urls and numbers with a plain message", () => {
    const email = SECTION_INFO.general.fields.find((f) => f.name === "contactEmail")!;
    expect(readField(email, "not-an-email").error).toMatch(/valid email/);
    expect(readField(email, " Office@Example.com ")).toEqual({ value: "office@example.com" });

    const link = SECTION_INFO.general.fields.find((f) => f.name === "social.x")!;
    expect(readField(link, "http://x.com/me").error).toMatch(/https/);
    expect(readField(link, "javascript:alert(1)").error).toMatch(/https/);
    expect(readField(link, "")).toEqual({ value: "" });

    const days = SECTION_INFO.newsletter.fields.find((f) => f.name === "pendingRetentionDays")!;
    expect(readField(days, "31").error).toMatch(/at most 30/);
    expect(readField(days, "6").error).toMatch(/at least 7/);
    expect(readField(days, "7.5").error).toMatch(/whole number/);
    expect(readField(days, "")).toEqual({ error: "Enter a number." });
  });

  it("accepts a site path or https for a link field, nothing else", () => {
    const field = SECTION_INFO.general.fields.find((f) => f.name === "announcement.linkUrl")!;
    expect(readField(field, "/blog/hello")).toEqual({ value: "/blog/hello" });
    expect(readField(field, "https://example.com/x")).toEqual({ value: "https://example.com/x" });
    expect(readField(field, "blog/hello").error).toBeDefined();
    expect(readField(field, "//evil.example").error).toBeUndefined();
  });

  it("keeps single-line text on one line and within its length", () => {
    const field = SECTION_INFO.general.fields.find((f) => f.name === "siteName")!;
    expect(readField(field, "A\nB").error).toMatch(/one line/);
    expect(readField(field, "x".repeat(61)).error).toMatch(/under 60/);
    expect(readField(field, "").error).toMatch(/required/);
  });

  it("checks handles and dates", () => {
    const handle = SECTION_INFO.seo.fields.find((f) => f.name === "xHandle")!;
    expect(readField(handle, "@code_from")).toEqual({ value: "@code_from" });
    expect(readField(handle, "has space").error).toBeDefined();
    const date = SECTION_INFO.analytics.fields.find((f) => f.name === "goalDeadline")!;
    expect(readField(date, "2027-01-31")).toEqual({ value: "2027-01-31" });
    expect(readField(date, "31/01/2027").error).toMatch(/YYYY-MM-DD/);
    expect(readField(date, "2027-13-40").error).toBeDefined();
  });
});

describe("parseSection", () => {
  it("collects every error at once and still returns a value", () => {
    const { errors, value } = parseSection("general", formFor("general", { siteName: "", contactEmail: "nope", "social.x": "ftp://x" }), context);
    expect(Object.keys(errors).sort()).toEqual(["contactEmail", "siteName", "social.x"]);
    expect(value.ownerName).toBe(DEFAULTS.general.ownerName);
  });

  it("will not switch on an empty announcement or a link without text", () => {
    const { errors } = parseSection("general", formFor("general", { "announcement.enabled": "on", "announcement.linkUrl": "/blog" }), context);
    expect(errors["announcement.text"]).toMatch(/Write the announcement/);
    expect(errors["announcement.linkLabel"]).toMatch(/text/);
  });

  it("refuses payments without a Stripe key, and live payments without the legal steps", () => {
    const form = formFor("payments", { enabled: "on" });
    expect(parseSection("payments", form, { stripeKeyMode: "none" }).errors.enabled).toMatch(/No Stripe key/);
    expect(parseSection("payments", form, { stripeKeyMode: "live" }).errors.enabled).toMatch(/legal step/);
    expect(parseSection("payments", form, { stripeKeyMode: "test" }).errors).toEqual({});

    const allTicked = formFor("payments", {
      enabled: "on",
      "legal.lawyerConsulted": "on",
      "legal.fagWording": "on",
      "legal.withdrawalNotice": "on",
      "legal.impressumAddress": "on",
      "legal.taxRegistration": "on",
    });
    expect(parseSection("payments", allTicked, { stripeKeyMode: "live" }).errors).toEqual({});
  });

  it("rejects a currency outside the list", () => {
    expect(parseSection("payments", formFor("payments", { currency: "BTC" }), context).errors.currency).toMatch(/Choose/);
  });
});

describe("fromStored", () => {
  it("fills gaps and wrong types from the defaults", () => {
    const value = fromStored("features", { commentsEnabled: "yes", courseWaitlistOpen: false, extra: 1 });
    expect(value).toEqual({ ...DEFAULTS.features, courseWaitlistOpen: false });
  });

  it("survives garbage", () => {
    expect(fromStored("general", null)).toEqual(DEFAULTS.general);
    expect(fromStored("analytics", "x")).toEqual(DEFAULTS.analytics);
    expect(fromStored("newsletter", { pendingRetentionDays: 12.5 })).toEqual(DEFAULTS.newsletter);
  });
});

describe("helpers", () => {
  it("names the fields that changed", () => {
    expect(changedFields(DEFAULTS.general, { ...DEFAULTS.general, siteName: "X", social: { ...DEFAULTS.general.social, x: "" } })).toEqual([
      "siteName",
      "social.x",
    ]);
  });

  it("tells a live key from a test key", () => {
    expect(stripeKeyMode(undefined)).toBe("none");
    expect(stripeKeyMode("sk_test_123")).toBe("test");
    expect(stripeKeyMode("sk_live_123")).toBe("live");
  });
});

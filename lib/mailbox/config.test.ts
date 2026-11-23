import { describe, expect, it } from "vitest";
import { mailboxConfig, selfAddresses } from "./config";

describe("mailboxConfig", () => {
  it("is off until both the user and the app password are set", () => {
    expect(mailboxConfig({ MAILBOX_USER: "office@codefromscratch.org" })).toBeNull();
    expect(mailboxConfig({ MAILBOX_PASSWORD: "x" })).toBeNull();
  });

  it("uses Private Email over TLS by default", () => {
    expect(mailboxConfig({ MAILBOX_USER: "office@codefromscratch.org", MAILBOX_PASSWORD: "x" })).toMatchObject({
      imap: { host: "mail.privateemail.com", port: 993, secure: true },
      smtp: { host: "mail.privateemail.com", port: 465, secure: true },
      saveSent: true,
    });
  });

  it("allows a plain connection only to local test servers", () => {
    const local = mailboxConfig({ MAILBOX_USER: "a@b.co", MAILBOX_PASSWORD: "x", MAILBOX_TLS: "off", MAILBOX_IMAP_HOST: "127.0.0.1", MAILBOX_SMTP_HOST: "localhost" });
    expect([local?.imap.secure, local?.smtp.secure]).toEqual([false, false]);
    const remote = mailboxConfig({ MAILBOX_USER: "a@b.co", MAILBOX_PASSWORD: "x", MAILBOX_TLS: "off", MAILBOX_IMAP_HOST: "mail.example.com" });
    expect([remote?.imap.secure, remote?.smtp.secure]).toEqual([true, true]);
  });
});

describe("selfAddresses", () => {
  it("counts the mailbox and the site's sending address as us", () => {
    const self = selfAddresses(mailboxConfig({ MAILBOX_USER: "Office@codefromscratch.org", MAILBOX_PASSWORD: "x" }), { EMAIL_FROM: "CodeFromScratch <hello@codefromscratch.org>" });
    expect(self.has("office@codefromscratch.org")).toBe(true);
    expect(self.has("hello@codefromscratch.org")).toBe(true);
  });
});

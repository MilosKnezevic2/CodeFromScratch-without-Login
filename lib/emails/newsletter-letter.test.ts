import { describe, it, expect } from "vitest";
import { renderLetter, renderLetterText, renderNotice } from "./newsletter-letter";
import { htmlToPlainText } from "@/lib/send-email";

const UNSUB = "https://codefromscratch.org/newsletter/unsubscribe?token=abc";

const card = {
  kicker: "New article",
  title: "Flexbox vs Grid",
  excerpt: "How to choose.",
  meta: "12 min read",
  url: "https://codefromscratch.org/blog/flexbox",
  cta: "Read the article",
};

describe("renderLetter", () => {
  it("always carries the unsubscribe link and the sender identity", () => {
    const html = renderLetter({ subject: "S", note: "Hello" }, UNSUB);
    expect(html).toContain(`href="${UNSUB}"`);
    expect(html).toContain("Milos Knezevic");
    expect(html).toContain("Graz, Austria");
  });

  it("escapes everything from the form, so no HTML can be injected", () => {
    const html = renderLetter(
      {
        subject: "<script>alert(1)</script>",
        preheader: "<b>x</b>",
        note: `<img src=x onerror="alert(1)">`,
        card: { ...card, title: "<i>t</i>" },
      },
      UNSUB,
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>x</b>");
    expect(html).not.toContain("<i>t</i>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("does not turn a javascript: string into a link", () => {
    const html = renderLetter({ subject: "S", note: "javascript:alert(1)" }, UNSUB);
    expect(html).not.toContain('href="javascript');
  });

  it("makes paragraphs from blank lines and links from bare URLs", () => {
    const html = renderLetter(
      { subject: "S", note: "One\nstill one\n\nTwo https://example.com/a." },
      UNSUB,
    );
    expect(html).toContain("One<br>still one");
    expect(html).toContain('<a href="https://example.com/a"');
    expect(html.match(/<p style="margin:0 0 16px/g)).toHaveLength(2);
  });

  it("shows the article card with its button", () => {
    const html = renderLetter({ subject: "S", card }, UNSUB);
    expect(html).toContain("Flexbox vs Grid");
    expect(html).toContain("12 min read");
    expect(html).toContain("Read the article");
    expect(html).toContain(`href="${card.url}"`);
  });

  it("contains no tracking pixel: the only image is the article cover", () => {
    const withoutImage = renderLetter({ subject: "S", card }, UNSUB);
    expect(withoutImage).not.toContain("<img");
    const withImage = renderLetter(
      { subject: "S", card: { ...card, imageUrl: "https://cdn.sanity.io/x.jpg" } },
      UNSUB,
    );
    expect(withImage.match(/<img/g)).toHaveLength(1);
  });
});

describe("renderLetterText", () => {
  it("has the content and the unsubscribe link, with no markup", () => {
    const text = renderLetterText({ subject: "S", note: "Hello", card }, UNSUB);
    expect(text).toContain("Hello");
    expect(text).toContain(`Read the article: ${card.url}`);
    expect(text).toContain(`Unsubscribe: ${UNSUB}`);
    expect(text).not.toContain("<");
  });
});

describe("htmlToPlainText", () => {
  it("keeps the link target of a notice readable in plain text", () => {
    const html = renderNotice({
      title: "Confirm",
      paragraphs: ["Press the button."],
      action: { label: "Confirm it", url: "https://codefromscratch.org/x?token=1" },
    });
    const text = htmlToPlainText(html);
    expect(text).toContain("Press the button.");
    expect(text).toContain("Confirm it (https://codefromscratch.org/x?token=1)");
    expect(text).not.toContain("<");
    expect(text).not.toContain("charset");
  });
});

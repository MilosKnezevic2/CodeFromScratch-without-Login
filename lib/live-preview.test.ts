import { describe, expect, it } from "vitest";
import { buildPreviewDocument } from "./live-preview";

describe("buildPreviewDocument", () => {
  it("wraps html, css and js in one standalone document", () => {
    const doc = buildPreviewDocument({
      html: "<button id='b'>Hi</button>",
      css: "button{color:red}",
      js: "document.title='x'",
    });
    expect(doc.startsWith("<!doctype html>")).toBe(true);
    expect(doc).toContain("<button id='b'>Hi</button>");
    expect(doc).toContain("button{color:red}");
    expect(doc).toContain("<script>document.title='x'</script>");
  });

  it("omits the script element when there is no js", () => {
    expect(buildPreviewDocument({ html: "<p>x</p>" })).not.toContain("<script>");
    expect(buildPreviewDocument({ html: "<p>x</p>", js: "   " })).not.toContain("<script>");
  });

  it("does not let a closing tag inside js end the script element early", () => {
    const doc = buildPreviewDocument({ js: "const s = '</script><img src=x>';" });
    expect(doc.match(/<\/script>/gi)).toHaveLength(1);
    expect(doc).toContain("<\\/script>");
  });

  it("does not let a closing tag inside css end the style element early", () => {
    const doc = buildPreviewDocument({ css: "a::after{content:'</STYLE><p>'}" });
    expect(doc.match(/<\/style>/gi)).toHaveLength(1);
  });

  it("always renders on a light canvas, whatever the site theme", () => {
    const doc = buildPreviewDocument({});
    expect(doc).toContain("color-scheme:light;");
    expect(doc).toContain("background:#fff");
  });
});

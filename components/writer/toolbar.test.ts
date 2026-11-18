import { describe, expect, it } from "vitest";
import { insertBlock, link, prefixLines, wrap } from "./toolbar";

describe("toolbar edits", () => {
  it("wraps the selection and keeps it selected", () => {
    const e = wrap("make this bold", 5, 9, "**", "**", "text");
    expect(e.text).toBe("make **this** bold");
    expect(e.text.slice(e.selStart, e.selEnd)).toBe("this");
  });

  it("wraps a placeholder when nothing is selected", () => {
    const e = wrap("ab", 1, 1, "`", "`", "code");
    expect(e.text).toBe("a`code`b");
    expect(e.text.slice(e.selStart, e.selEnd)).toBe("code");
  });

  it("prefixes every selected line and replaces an existing prefix", () => {
    expect(prefixLines("one\ntwo", 0, 7, "- ").text).toBe("- one\n- two");
    expect(prefixLines("## Title", 3, 3, "### ").text).toBe("### Title");
    expect(prefixLines("a\nb", 0, 3, (i) => `${i + 1}. `).text).toBe("1. a\n2. b");
    expect(prefixLines("> [!TIP] x", 0, 1, "> [!WARNING] ").text).toBe("> [!WARNING] x");
  });

  it("inserts a block on its own lines with blank lines around it", () => {
    const e = insertBlock("intro\nend", 5, 5, "---", 3);
    expect(e.text).toBe("intro\n\n---\n\nend");
    expect(e.selStart).toBe("intro\n\n---".length);
  });

  it("selects the URL of a new link so it can be pasted over", () => {
    const e = link("see MDN now", 4, 7);
    expect(e.text).toBe("see [MDN](https://) now");
    expect(e.text.slice(e.selStart, e.selEnd)).toBe("https://");
  });
});

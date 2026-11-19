import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "How to use the editor",
  description: "A step-by-step guide to writing a CodeFromScratch article in the Writer desk: formatting, code, demos, images, preview and review.",
  robots: { index: false, follow: false },
};

/** A toolbar button as it looks in the editor, so the text can point at it. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-flex min-w-7 items-center justify-center rounded-md border border-border bg-surface px-1.5 py-0.5 font-sans text-[0.85em] font-semibold text-foreground">
      {children}
    </kbd>
  );
}

const SECTIONS = [
  { id: "start", title: "1. Start an article" },
  { id: "page", title: "2. The page at a glance" },
  { id: "text", title: "3. Write and format text" },
  { id: "links", title: "4. Links" },
  { id: "lists", title: "5. Lists" },
  { id: "blocks", title: "6. Code, boxes, demos and dividers" },
  { id: "images", title: "7. Images" },
  { id: "paste", title: "8. Pasting from Google Docs or Word" },
  { id: "preview", title: "9. Preview and saving" },
  { id: "review", title: "10. Send for review" },
  { id: "shortcuts", title: "Keyboard shortcuts" },
  { id: "checklist", title: "Before you press Send" },
] as const;

const SHORTCUTS = [
  ["Bold", "Ctrl + B", "⌘ + B"],
  ["Italic", "Ctrl + I", "⌘ + I"],
  ["Underline", "Ctrl + U", "⌘ + U"],
  ["Inline code", "Ctrl + '", "⌘ + '"],
  ["Undo", "Ctrl + Z", "⌘ + Z"],
  ["Redo", "Ctrl + Shift + Z", "⌘ + Shift + Z"],
  ["Line break inside a paragraph", "Shift + Enter", "Shift + Enter"],
  ["Indent inside a code field", "Tab", "Tab"],
] as const;

const CHECKLIST = [
  "A title of at least 10 characters that says what the reader will be able to do.",
  "A one- or two-sentence summary (at least 40 characters).",
  "At least 300 words of explanation (code does not count).",
  "Every image has a description (alt text).",
  "You ran every code sample and demo yourself, and it works.",
  "Headings tell the story on their own: someone skimming only the headings should get the idea.",
  "You read it once in Preview.",
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-border pt-8">
      <h2 id={`${id}-h`} className="text-xl font-bold text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-muted [&_strong]:font-semibold [&_strong]:text-foreground">{children}</div>
    </section>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="ml-5 list-decimal space-y-2 marker:font-semibold marker:text-accent">{children}</ol>;
}

function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-r-lg border-l-4 border-accent bg-accent/10 px-4 py-3 text-sm text-foreground">{children}</p>;
}

/** The author's manual for the Writer desk editor. Plain English, one task per section. */
export default function WriterGuidePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <Link href="/dashboard/write" className="text-sm font-semibold text-muted hover:text-foreground">
        ← Your articles
      </Link>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Writer desk · guide</p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">How to use the editor</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Everything you need to write a CodeFromScratch article, from the first heading to sending it for review. It takes about ten minutes to read; keep it
        open in a second tab the first time you write.
      </p>

      <nav aria-label="On this page" className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm font-bold text-foreground">On this page</p>
        <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 space-y-10">
        <Section id="start" title={SECTIONS[0].title}>
          <Steps>
            <li>
              Log in with your author account and open <strong>Your articles</strong> (in your dashboard menu, or{" "}
              <Link href="/dashboard/write" className="text-accent underline underline-offset-2">
                /dashboard/write
              </Link>
              ).
            </li>
            <li>
              Press <Key>New article</Key>. The editor opens with an empty draft that only you can see.
            </li>
            <li>Type a title, a short summary and then the article itself. There is no save button: the editor saves on its own.</li>
          </Steps>
          <p>
            You can keep several drafts at once and come back to any of them from <strong>Your articles</strong>. A draft you have never sent can be deleted
            with <Key>Delete</Key> in the top bar.
          </p>
        </Section>

        <Section id="page" title={SECTIONS[1].title}>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Top bar:</strong> the draft&apos;s status, whether your last change is saved, the word count, and <Key>Send for review</Key>.
            </li>
            <li>
              <strong>Write / Preview:</strong> switch between editing and seeing the article exactly as readers will.
            </li>
            <li>
              <strong>Title</strong> and <strong>Summary:</strong> the summary appears on article cards and in search results, so make it say what the
              reader will be able to do after reading (up to 300 characters).
            </li>
            <li>
              <strong>Toolbar:</strong> above the text, it stays visible while you scroll.
            </li>
            <li>
              <strong>The article:</strong> you write directly in it. Headings, bold text, code and boxes look the way they will look on the site.
            </li>
          </ul>
        </Section>

        <Section id="text" title={SECTIONS[2].title}>
          <p>
            Type as you would in any word processor. <Key>Enter</Key> starts a new paragraph.
          </p>
          <p>
            <strong>Headings.</strong> Put the cursor in a line and choose its style in the first menu of the toolbar:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Heading</strong> for the main sections of the article (they also build the table of contents readers see);
            </li>
            <li>
              <strong>Subheading</strong> for steps inside a section;
            </li>
            <li>
              <strong>Small heading</strong> rarely, for a short label;
            </li>
            <li>
              <strong>Quote</strong> for a quotation, with its source in the text;
            </li>
            <li>
              <strong>Paragraph</strong> to turn a line back into normal text.
            </li>
          </ul>
          <Note>Use headings in order: a Subheading belongs under a Heading. Do not use bold text in place of a heading.</Note>
          <p>
            <strong>Bold, italic and the rest.</strong> Select some words and press <Key>B</Key> bold, <Key>I</Key> italic, <Key>U</Key> underline,{" "}
            <Key>S</Key> strikethrough, or <Key>{"</>"}</Key> for inline code. Inline code is for short things inside a sentence, such as a function name
            like <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em] text-accent">fetch()</code>; anything longer than a line
            goes in a code block. Press the same button again to remove the formatting. A highlighted button means the formatting is on where your cursor
            is.
          </p>
          <p>
            <Key>↶</Key> and <Key>↷</Key> undo and redo.
          </p>
        </Section>

        <Section id="links" title={SECTIONS[3].title}>
          <Steps>
            <li>Select the words that should become the link (the button stays grey until something is selected).</li>
            <li>
              Press <Key>Link</Key>, paste the address and press <Key>Enter</Key> or <Key>Add link</Key>.
            </li>
          </Steps>
          <p>
            A link can be a full web address (<code className="font-mono text-sm">https://…</code>), an email (
            <code className="font-mono text-sm">mailto:…</code>) or a page on this site (<code className="font-mono text-sm">/blog/…</code>).
            Other kinds are refused. Links to other sites open in a new tab automatically.
          </p>
          <p>
            To remove a link, put the cursor in it: the toolbar shows the address with a <Key>✕</Key>. Press it.
          </p>
          <Note>Make the link text say where it goes: &quot;the MDN page on AbortController&quot;, never &quot;click here&quot;.</Note>
        </Section>

        <Section id="lists" title={SECTIONS[4].title}>
          <p>
            Put the cursor in a line and press <Key>• List</Key> for bullets or <Key>1. List</Key> for numbered steps. <Key>Enter</Key> adds the next item;{" "}
            <Key>Enter</Key> on an empty item ends the list. Press the button again to turn an item back into a paragraph.
          </p>
          <p>Use numbers when order matters (steps to follow) and bullets when it does not.</p>
        </Section>

        <Section id="blocks" title={SECTIONS[5].title}>
          <p>
            The <Key>+</Key> buttons add a block below the paragraph your cursor is in. Every block has <Key>↑</Key> <Key>↓</Key> to move it and <Key>Remove</Key> to delete it.
          </p>
          <h3 className="pt-2 text-lg font-semibold text-foreground">Code</h3>
          <p>
            <Key>+ Code</Key> adds a code block. Choose the language (it decides the colours readers see), optionally type a file name such as{" "}
            <code className="font-mono text-sm">components/SearchBox.tsx</code>, then paste or type the code. <Key>Tab</Key> indents by two spaces.
          </p>
          <Note>Run every code sample before you send the article. A sample that does not work is the fastest way to lose a reader.</Note>
          <h3 className="pt-2 text-lg font-semibold text-foreground">Highlighted boxes</h3>
          <p>
            <Key>+ Tip</Key> and <Key>+ Warning</Key> add a box for one or two sentences the reader must not miss. Inside the box you can switch its kind:
            Tip, Info, Warning or Error. Use them sparingly; three boxes in a row means none of them stands out.
          </p>
          <h3 className="pt-2 text-lg font-semibold text-foreground">Live demos</h3>
          <p>
            <Key>+ Live demo</Key> adds an example readers can try in the page. Fill in a title, then HTML, CSS and JavaScript (any of them may stay
            empty), and set the height. <Key>Run it</Key> shows the result right there. The demo runs in a sandbox: it cannot reach the site, the
            network or the reader&apos;s data, so keep it self-contained.
          </p>
          <h3 className="pt-2 text-lg font-semibold text-foreground">Dividers</h3>
          <p>
            <Key>+ Divider</Key> adds a line between two larger parts of the article. Choose plain, decorative or dotted.
          </p>
        </Section>

        <Section id="images" title={SECTIONS[6].title}>
          <Steps>
            <li>
              Put the cursor in the paragraph the image should follow and press <Key>+ Image</Key>.
            </li>
            <li>Choose a PNG, JPEG, WebP or GIF file up to 4 MB. It uploads and appears in the article.</li>
            <li>
              Write the <strong>description (alt text)</strong>: what the image shows, in one sentence, for readers who cannot see it. It is required
              before the article can be sent.
            </li>
            <li>Optionally add a caption, and pick the size (small, medium, full width) and alignment.</li>
          </Steps>
          <p>
            Use your own screenshots and diagrams, at least 1200 px wide so they stay sharp. Crop away everything that is not the point, and hide
            personal data (emails, tokens, names) before you take the screenshot. SVG files are not accepted.
          </p>
          <p>
            Every image needs to be yours or free to use; tell Milos where an image comes from if you did not make it. The cover image of the article is
            chosen at publishing time, so you do not need to add one.
          </p>
        </Section>

        <Section id="paste" title={SECTIONS[7].title}>
          <p>
            If you prefer writing elsewhere first, copy the text from Google Docs or Word and paste it into the editor. Headings, bold, italic, links and
            lists come along. Afterwards, check that:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>headings have the right level (Heading, Subheading);</li>
            <li>code is in code blocks, not in normal paragraphs (paste it again into a <Key>+ Code</Key> block);</li>
            <li>images are added with <Key>+ Image</Key>, since pasted images are not carried over.</li>
          </ul>
        </Section>

        <Section id="preview" title={SECTIONS[8].title}>
          <p>
            <Key>Preview</Key> shows the article with the site&apos;s own design, as readers will see it, demos included. Code gets its colours on
            the published page. <Key>Write</Key> takes you back; nothing is lost in between.
          </p>
          <p>
            The editor saves a moment after you stop typing. The top bar shows <strong>Unsaved changes</strong>, then <strong>Saving…</strong>, then{" "}
            <strong>Saved</strong> with the time. If you try to leave with unsaved changes, the browser asks first. If saving fails (for example
            without internet), the top bar says so; keep the tab open and it saves on your next change once you are back online.
          </p>
        </Section>

        <Section id="review" title={SECTIONS[9].title}>
          <Steps>
            <li>
              When the article is complete, press <Key>Send for review</Key> and confirm. If something is still missing, the editor tells you what.
            </li>
            <li>
              The article locks while Milos reads it. You can still open and read it, but not change it.
            </li>
            <li>
              It comes back in one of two ways:
              <ul className="ml-5 mt-1 list-disc space-y-1">
                <li>
                  <strong>Changes requested:</strong> his notes appear at the top of the editor. Make the changes and send it again.
                </li>
                <li>
                  <strong>Approved:</strong> Milos prepares it for publishing (category, cover image, final edits) and publishes it under your name.
                </li>
              </ul>
            </li>
          </Steps>
          <Note>
            Only Milos publishes. Your account can write and send your own drafts; it has no access to other articles, readers&apos; data or the
            site&apos;s settings.
          </Note>
        </Section>

        <Section id="shortcuts" title={SECTIONS[10].title}>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <caption className="sr-only">Keyboard shortcuts on Windows and Mac</caption>
              <thead className="bg-surface text-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Action
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Windows / Linux
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Mac
                  </th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUTS.map(([action, win, mac]) => (
                  <tr key={action} className="border-t border-border">
                    <th scope="row" className="px-4 py-2 font-normal text-foreground">
                      {action}
                    </th>
                    <td className="px-4 py-2 font-mono text-xs">{win}</td>
                    <td className="px-4 py-2 font-mono text-xs">{mac}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="checklist" title={SECTIONS[11].title}>
          <ul className="space-y-2">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-1 inline-flex h-4 w-4 shrink-0 rounded border border-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>
            The full rules for authors (AI help, rights, figures) are on the{" "}
            <Link href="/write-for-us" className="text-accent underline underline-offset-2">
              Write for us
            </Link>{" "}
            page. Stuck on something? Write to{" "}
            <a href="mailto:office@codefromscratch.org" className="text-accent underline underline-offset-2">
              office@codefromscratch.org
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

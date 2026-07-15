/**
 * Content wave — cycle 1, part A (seq 1–3 of docs/CONTENT-PLAN.md).
 *   1. Web Fundamentals   · How the Browser Renders a Page (2026-07-20)
 *   2. JS Frameworks      · Your First React Component, Properly (2026-07-22)
 *   3. CSS Ecosystem      · Flexbox Mental Models (2026-07-24)
 * Imported by scripts/seed-content.mjs.
 */
import { p, h2, h3, code, callout, bold, inlineCode, link, richP, bullet, bulletRich, numbered } from "./pt.mjs";

export const posts = [
  // ───────────────────────────────────────────────────────────────────
  // 1 · Web Fundamentals — cycle 1 (2026-07-20)
  // ───────────────────────────────────────────────────────────────────
  {
    title: "How the Browser Renders a Page: DOM, CSSOM, and the Critical Path",
    excerpt:
      "HTML becomes the DOM, CSS becomes the CSSOM, and everything between your markup and the screen follows rules. This is the mental model that makes performance advice finally make sense.",
    categoryName: "Web Fundamentals",
    tagNames: ["Web Performance & Core Web Vitals", "CSS"],
    difficulty: "beginner",
    seoTitle: "How Does the Browser Render a Page? DOM, CSSOM & Paint",
    seoDescription:
      "How does the browser render a page? A practical walk through DOM, CSSOM, layout, paint, and compositing — and how to watch each stage in Chrome DevTools.",
    publishDate: "2026-07-20",
    readingTime: 9,
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&q=80",
    imageAlt: "Earth at night seen from orbit with glowing networks of city lights",
    content: [
      richP(
        "The first time Lighthouse told me to \"eliminate render-blocking resources,\" I did what most of us do: searched for the exact phrase, copied a ",
        inlineCode("defer"),
        " attribute out of an answer thread, and watched the score tick up. It worked. I could not have told you why."
      ),
      p(
        "That gap — between applying performance fixes and understanding them — closes in exactly one place: the pipeline the browser runs every time it turns your HTML, CSS, and JavaScript into pixels. Once you can picture that pipeline, every audit message, every waterfall chart, and every \"move your script tag\" tip stops being folklore. Each one becomes a statement about a specific stage, and you can reason about it instead of memorizing it."
      ),
      richP(bold("What you'll walk away with:"), " a working map of the whole pipeline, and the leverage points on it."),
      ...bullet([
        "A six-stage mental model of how markup becomes pixels: DOM, CSSOM, render tree, layout, paint, composite",
        "What actually blocks rendering (CSS) versus what blocks parsing (scripts) — and how defer and async change the deal",
        "A repeatable way to watch every stage of your own page in the DevTools Performance panel",
        "The vocabulary to evaluate any performance advice you read from here on, including mine",
      ]),

      h2("The pipeline, end to end"),
      p(
        "Here is the whole story in one paragraph, before we slow down. The browser receives HTML as a stream of bytes and parses it into the DOM, a tree of objects representing your document. Stylesheets are parsed into a second tree, the CSSOM. The two combine into a render tree containing everything that will actually be displayed. Layout then computes the exact size and position of every box, paint turns those boxes into drawing instructions, and compositing assembles the painted layers into the frame you see. Every page load runs this pipeline at least once; every animation, style change, and DOM update re-runs some part of it."
      ),
      ...numbered([
        "Parse HTML into the DOM — the tree of elements that JavaScript can read and modify.",
        "Parse CSS into the CSSOM — every rule from every stylesheet, resolved into one structure.",
        "Combine both into the render tree — only the nodes that will actually be displayed.",
        "Layout: calculate the geometry — where every box sits and how big it is.",
        "Paint: turn the boxes into pixels, recorded in layers.",
        "Composite: assemble the layers, apply transforms and opacity, and put the frame on screen.",
      ]),
      p(
        "One definition before we descend: the critical rendering path is the minimum chain of work between the first byte of HTML and the first pixels on screen. Anything on that path — the HTML itself, render-blocking CSS, synchronous scripts — delays first render. Anything off the path doesn't. Most load-time optimization is exactly one move, repeated: take things off this path."
      ),

      h2("HTML becomes the DOM"),
      p(
        "Parsing HTML is forgiving and incremental. Forgiving, because the parser recovers from unclosed tags and bad nesting instead of refusing to render — a decision from the nineties that we all still benefit from. Incremental, because the browser does not wait for the whole document: it builds the DOM as bytes arrive, and it can start rendering the top of the page while the bottom is still on the network. That is why a long article shows you its first screen before the footer exists anywhere on your machine."
      ),
      code(
        "html",
        `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Roast levels, explained</title>
    <link rel="stylesheet" href="/styles.css" />
    <script src="/app.js"></script>
  </head>
  <body>
    <h1>Roast levels, explained</h1>
    <p>Light roasts keep more of the bean's origin character...</p>
  </body>
</html>`,
        "index.html"
      ),
      p(
        "Keep this little page in mind — one stylesheet and one script, both in the head. As written, it has two performance problems, and by the end of this article you will be able to name both on sight."
      ),
      callout(
        "info",
        "Deeper: while the main parser works (or waits), a second lightweight scanner — the preload scanner — reads ahead through the raw HTML and starts downloads for anything fetchable it finds: stylesheets, scripts, images. This is why resources declared in markup are discovered almost immediately, while resources hidden inside CSS files (background images, fonts) or created by JavaScript are discovered late, only after their host file has downloaded and parsed. \"Keep it visible to the preload scanner\" is the reasoning behind resource hints and behind preferring <img> over CSS background images for content."
      ),

      h2("CSS becomes the CSSOM — and blocks rendering while it does"),
      p(
        "Every stylesheet is parsed into the CSS Object Model, or CSSOM: the browser's complete picture of every rule that could apply to the page. Unlike HTML parsing, this is all-or-nothing. The cascade means a rule at the very end of a file can override everything before it, so a half-downloaded stylesheet is unusable — the browser cannot safely style anything until it has seen all of it."
      ),
      p(
        "This is why CSS is render-blocking. The browser keeps parsing HTML while styles download, but it refuses to paint. The alternative would be showing the unstyled page and restyling it when the CSS lands — a flash of unstyled content followed by the whole pipeline running again. Browsers decided a short blank wait beats a jarring restyle, and they have held that line for decades. Note the precise wording, though: CSS blocks rendering, not parsing. The DOM keeps growing while everyone waits for the stylist."
      ),
      p(
        "Render-blocking is also scoped to stylesheets that apply right now. A media attribute that doesn't currently match demotes the download and takes it off the critical path entirely:"
      ),
      code(
        "html",
        `<!-- Blocks rendering: it styles the page you're about to see -->
<link rel="stylesheet" href="/styles.css" />

<!-- Downloads at low priority, never blocks: wrong medium -->
<link rel="stylesheet" href="/print.css" media="print" />

<!-- Blocks only when the condition matches -->
<link rel="stylesheet" href="/wide.css" media="(min-width: 64rem)" />`,
        "index.html"
      ),
      callout(
        "warning",
        "Deeper: avoid @import in CSS you ship. The browser only discovers an @import after downloading and parsing the stylesheet that contains it, which chains a second render-blocking round trip behind the first. The preload scanner can see your <link> tags; it cannot see inside files that haven't arrived yet. Let your build tool flatten imports into one file."
      ),

      h2("Scripts: the parser's handbrake"),
      p(
        "A classic script tag — no attributes — stops HTML parsing dead. The parser halts, the script downloads (if external) and executes, and only then does parsing resume. The reason is historical but ironclad: a script can call document.write and rewrite the rest of the document, so the parser cannot safely continue past one. That is what \"parser-blocking\" means, and it is the first problem with our example page."
      ),
      p(
        "The second problem is an interaction most developers never hear about. A script might read styles — getComputedStyle, an element's dimensions — so the browser will not execute it while a stylesheet above it is still downloading. Follow the chain: your CSS blocks your script, and your script blocks your parser. One slow stylesheet plus one synchronous script in the head, and nothing renders until both have resolved. Two small files, one long blank screen."
      ),
      p("Two attributes — and one modern default — change the contract:"),
      code(
        "html",
        `<!-- Parser-blocking: halts HTML parsing while it loads and runs -->
<script src="/app.js"></script>

<!-- defer: downloads in parallel, runs after parsing, in document order -->
<script src="/app.js" defer></script>

<!-- async: downloads in parallel, runs the moment it arrives, any order -->
<script src="/analytics.js" async></script>

<!-- Modules are deferred by default: no attribute needed -->
<script type="module" src="/app.js"></script>`,
        "index.html"
      ),
      ...bulletRich([
        [
          inlineCode("defer"),
          " is the default choice for your own code: parsing never stops, and scripts run in document order once the DOM is complete, just before ",
          inlineCode("DOMContentLoaded"),
          " fires.",
        ],
        [
          inlineCode("async"),
          " suits scripts with no dependencies and no dependents — analytics, error reporting. Arrival order decides execution order, so never let two async scripts rely on each other.",
        ],
        [
          inlineCode("type=\"module\""),
          " behaves like ",
          inlineCode("defer"),
          " automatically; adding ",
          inlineCode("async"),
          " to a module makes it run as soon as it and its imports are ready instead.",
        ],
      ]),
      callout(
        "tip",
        "Deeper: there is one honest use for a synchronous inline script in the head — a few lines that read the saved theme preference and set a class on <html> before anything paints. Run it any later and your dark-mode users get a white flash on every visit. It is the exception that proves the rule: the code must run before first render, so it has earned its place on the critical path. Keep it tiny, inline, and dependency-free."
      ),

      h2("Render tree, layout, paint, composite"),
      p(
        "With the DOM and CSSOM built, the browser merges them into the render tree: every node that will be displayed, paired with its computed styles. Not everything makes it in. An element with display: none is skipped entirely — no geometry, no cost downstream. An element with visibility: hidden does make it in: it isn't painted, but it occupies space, so layout still accounts for it. Head elements, meta tags, and the scripts themselves never appear at all."
      ),
      p(
        "Layout — you will also hear \"reflow\" — walks that tree and computes geometry: the exact position and size of every box, given the viewport, the fonts, and the content. It is recursive by nature. A width change on one container can cascade into fresh calculations for thousands of descendants, which is why layout is the stage that hurts most when triggered carelessly."
      ),
      p(
        "Paint turns the laid-out boxes into actual pixels — text, colors, borders, shadows — recorded into one or more layers. Compositing then assembles those layers into the final frame, applying transforms and opacity on the way. That last stage is special: it can run on its own thread, largely independent of whatever JavaScript is doing."
      ),
      callout(
        "info",
        "Deeper: compositing is why \"animate transform and opacity\" is the oldest advice in web animation. The compositor thread can move, scale, and fade an already-painted layer without the main thread's help, so those animations stay smooth even while your JavaScript is busy. Animating width, top, or left re-runs layout every frame; animating box-shadow or color re-runs paint. The pipeline stage you touch determines the price you pay — that single sentence explains most animation performance advice ever written."
      ),

      h2("Watching it happen in DevTools"),
      p(
        "None of this is hidden. The Performance panel in Chrome or Edge shows every stage with real timings on your real page, and learning to read it will teach you more than any article — including this one. Here is the loop I run on a page that feels slow:"
      ),
      ...numbered([
        "Open DevTools, switch to the Performance tab, and click the record-and-reload button. It profiles the page from a cold start and stops by itself.",
        "Read the Main track left to right: blue Parse HTML slices, yellow script evaluation, purple Recalculate Style and Layout, green Paint and Commit.",
        "Hover along the filmstrip at the top to see exactly what was on screen at each moment — find the first frame that isn't blank.",
        "Look at everything left of that first painted frame. Whatever fills the gap — a slow stylesheet in the Network track, a yellow block of script — is your critical path, drawn to scale.",
        "Click any slice for details; long script blocks expand into a call tree, so you can name the exact function responsible.",
      ]),
      p(
        "Your first recording will feel like a wall of noise. Record a page you know well — your own blog, your app's login screen — and shapes start to emerge, because you can connect slices to code you wrote. You are not trying to read every event. You are looking for proportions: how much yellow runs before the first meaningful screenshot, how much purple follows every interaction, how late the CSS arrives in the Network track."
      ),
      callout(
        "tip",
        "Recent Chrome releases fold an Insights sidebar into the Performance panel that names render-blocking requests, breaks down LCP, and flags layout shifts for the trace you just recorded. Treat it as a well-informed second opinion: check its findings against the flame chart until you can predict what it will say. The day you can, you have the mental model this article is about."
      ),

      h2("The pipeline after load: layout thrashing"),
      p(
        "The pipeline does not retire once the page is up — every DOM change and style write schedules parts of it again. Browsers are smart about the scheduling: change ten classes in one event handler and you usually pay for a single style-and-layout pass, batched right before the next frame is due."
      ),
      p(
        "Unless you force their hand. Reading any geometry — offsetHeight, getBoundingClientRect — while there are pending style changes demands an answer now, so the browser runs layout synchronously, in the middle of your JavaScript. Do that inside a loop and you get layout thrashing: a forced layout per iteration."
      ),
      code(
        "js",
        `// BAD: read-write-read-write forces a synchronous layout per row
for (const row of rows) {
  const height = row.offsetHeight;        // read  - must flush layout
  row.style.height = height + 4 + "px";   // write - dirties layout again
}

// GOOD: batch every read, then every write - one layout total
const heights = rows.map((row) => row.offsetHeight);
rows.forEach((row, i) => {
  row.style.height = heights[i] + 4 + "px";
});`,
        "layout-thrash.js"
      ),
      p(
        "The fix always has the same shape: group your reads, then group your writes. If the work is visual, do the writing inside requestAnimationFrame so it lands right where the browser wants it — just before the next frame is produced. In the Performance panel, thrashing shows up as a comb of purple Layout slices inside one yellow script block, and DevTools will warn you about forced reflow in the summary."
      ),

      h2("Where this bites you"),
      ...bulletRich([
        [
          inlineCode("defer"),
          " on an inline script is silently ignored — the attribute only works with ",
          inlineCode("src"),
          ". Inline scripts always execute immediately, so either externalize the code or move the block to the end of the body.",
        ],
        [
          "An ",
          inlineCode("async"),
          " script that touches the DOM is a race. It runs whenever it lands — sometimes before the elements it manipulates exist — and the failure is intermittent, which makes it expensive to debug. If it needs the DOM, have it wait for ",
          inlineCode("DOMContentLoaded"),
          ", or just use ",
          inlineCode("defer"),
          ".",
        ],
        [
          "Hiding an image with ",
          inlineCode("display: none"),
          " does not stop the download — the preload scanner grabs the ",
          inlineCode("src"),
          " long before CSS gets a vote. To serve different images per breakpoint, use ",
          inlineCode("<picture>"),
          " or ",
          inlineCode("srcset"),
          ", which the browser evaluates before fetching.",
        ],
        [
          "Web fonts sit two hops down the path: the browser discovers the font file only after the CSS arrives and the render tree actually needs a glyph from it. If late text swaps bother you, preload the one or two weights you use above the fold and set ",
          inlineCode("font-display"),
          " deliberately.",
        ],
        [
          "A tiny stylesheet on a slow origin still blocks like a big one — the critical path is measured in round trips, not bytes alone. Before you spend an evening minifying CSS, check where it is served from and whether it could be inlined or arrive earlier.",
        ],
      ]),

      h2("Where to go from here"),
      p(
        "You now have the model: DOM plus CSSOM make the render tree; layout, paint, and composite turn it into frames; CSS blocks rendering, synchronous scripts block parsing, and DevTools shows you all of it in color. Nothing here is framework-specific — React, Vue, and hand-written HTML all funnel through the same six stages, and every performance technique you will ever apply is an attack on one of them."
      ),
      richP(
        "Next, learn to put honest numbers on what you just learned to see: ",
        link(
          "Measuring Before Optimizing: Lighthouse, WebPageTest, and Real-User Data",
          "/blog/measuring-before-optimizing-lighthouse-webpagetest-and-real-user-data"
        ),
        " covers how to profile pages without fooling yourself. Then work through the ",
        link(
          "web performance optimization checklist",
          "/blog/web-performance-optimization-a-developer-s-checklist"
        ),
        " with this pipeline in mind — every item on it maps to a stage you can now call by name."
      ),
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 2 · JavaScript Frameworks — cycle 1 (2026-07-22)
  // ───────────────────────────────────────────────────────────────────
  {
    title: "Your First React Component, Properly: Props, State, and Thinking in React",
    excerpt:
      "Props are your component's API, state is its memory, and most React bugs come from confusing the two. Build a real product card the way experienced developers structure it.",
    categoryName: "JavaScript Frameworks",
    tagNames: ["React", "TypeScript"],
    difficulty: "beginner",
    seoTitle: "React Components, Props, and State: a Proper Tutorial",
    seoDescription:
      "A React components, props, and state tutorial without the counter demo: build a typed product card with derived values, lifted state, and honest gotchas.",
    publishDate: "2026-07-22",
    readingTime: 10,
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1400&q=80",
    imageAlt: "Glowing blue React atom logo rendered on a dark background",
    content: [
      p(
        "Every React tutorial opens with a counter: click the button, watch the number go up. You can build twenty counters and still freeze the first time a real interface asks a real question. The price lives here, the quantity lives there, the cart total needs both — who owns what?"
      ),
      p(
        "That question — where does data live — is the actual skill. The syntax of components, props, and state takes an afternoon; the judgment about which one a given value should be is what separates codebases you can extend from codebases you fight. So instead of a counter, let's build something real: a product card for a small shop, in React 19 with TypeScript, grown step by step the way I would grow it in production code."
      ),
      richP(bold("What you'll walk away with:"), " the three moves every real component is made of."),
      ...bullet([
        "Components as plain functions, and props as the API you design for them — typed from the first line",
        "Where state actually belongs, plus a one-question test for whether something should be state at all",
        "Derived values: why computing beats storing, and the stale-state bug you'll stop writing",
        "Lifting state up when two components need the same data, without turning the tree into prop soup",
      ]),

      h2("A component is a function that returns UI"),
      p(
        "Strip the mystique first: a React component is a function. It takes one argument — an object everyone calls props — and returns a description of UI written in JSX, the HTML-like syntax that compiles down to plain function calls. Here is the smallest genuinely useful component in our shop: a price."
      ),
      code(
        "tsx",
        `interface PriceTagProps {
  amount: number;
}

const euro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

export function PriceTag({ amount }: PriceTagProps) {
  return <span className="price">{euro.format(amount)}</span>;
}`,
        "components/PriceTag.tsx"
      ),
      p(
        "Two details are worth noticing before we move on. The props arrive as a single object, and the interface names its shape — so TypeScript will reject a string where a number belongs at compile time, no test required. And the component has no idea where amount comes from: parent state, a server response, a hard-coded value in a test. That ignorance is the feature. It is what makes the component reusable and testable in isolation."
      ),
      p(
        "When React renders <PriceTag amount={14} />, it calls your function with { amount: 14 } and slots the returned JSX into the page. Re-rendering is nothing more exotic than calling the function again with fresh props. Hold onto that: a render is a function call. Most React confusion dissolves against that one fact."
      ),

      h2("Props are the component's API"),
      p(
        "I mean API literally. A component's props are a public interface that other code will depend on, and the habits that make a good function signature make good props: few parameters, precise types, safe defaults. Let's grow PriceTag the way requirements actually arrive — \"we need sale prices by Friday\" — without breaking a single existing caller."
      ),
      code(
        "tsx",
        `interface PriceTagProps {
  amount: number;
  /** ISO 4217 code - defaults to EUR */
  currency?: string;
  /** When present, amount renders struck through next to it */
  salePrice?: number;
}

export function PriceTag({ amount, currency = "EUR", salePrice }: PriceTagProps) {
  const format = (value: number) =>
    new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(value);

  if (salePrice === undefined) {
    return <span className="price">{format(amount)}</span>;
  }

  return (
    <span className="price">
      <s aria-hidden="true">{format(amount)}</s> <strong>{format(salePrice)}</strong>
      <span className="visually-hidden">
        on sale for {format(salePrice)}, originally {format(amount)}
      </span>
    </span>
  );
}`,
        "components/PriceTag.tsx"
      ),
      p(
        "Both new props are optional, so every existing <PriceTag amount={14} /> keeps working — optional props with sensible defaults are how components evolve without a migration. Notice the check, too: after salePrice === undefined returns early, TypeScript narrows the type, so the second branch knows salePrice is a number. And the struck-through price is hidden from screen readers, replaced by a plain sentence — sighted users get typography, everyone else gets words."
      ),
      p(
        "One design habit pays for itself more than any other: name props for what they mean to the caller, not for what your implementation does with them. The caller knows it has a sale price; it should not need to know you render a strikethrough. You will see the same idea in the next component, which takes a single tone union instead of a pile of booleans — isNew plus isSale invites the impossible combination, while a union makes invalid states unrepresentable."
      ),
      h3("children is a prop like any other"),
      p(
        "The children prop is how components wrap content without knowing what it is. There is no magic involved: whatever you nest between a component's opening and closing tags arrives as props.children."
      ),
      code(
        "tsx",
        `import type { ReactNode } from "react";

interface ProductBadgeProps {
  tone: "new" | "sale" | "low-stock";
  children: ReactNode;
}

export function ProductBadge({ tone, children }: ProductBadgeProps) {
  return <span className={\`badge badge--\${tone}\`}>{children}</span>;
}`,
        "components/ProductBadge.tsx"
      ),
      p(
        "ReactNode is the widest sensible type for children — strings, elements, numbers, fragments, null. Composition through children is also your escape from components with fourteen boolean props: instead of iconLeft, iconRight, and labelSize flags, the parent simply passes the content it wants rendered inside."
      ),
      p(
        "While we are here, the splitting question: when does a chunk of JSX deserve to be its own component? My threshold is reasons, not lines. PriceTag exists because price formatting is a decision that will change on its own schedule — new currency, new sale rules — independent of any card that displays it. A component per reason-to-change keeps every file small without producing a folder of one-line wrappers that merely rename a div."
      ),
      callout(
        "info",
        "Deeper: since React 19 you no longer need forwardRef in new code — ref is a regular prop on function components, typed like any other. One more boundary worth naming: TypeScript props exist at compile time only. The moment data crosses a trust boundary — a fetch response, a form body — types are wishes, not guarantees. Validate at that boundary (Zod is my pick) and let components stay naive."
      ),

      h2("State is memory between renders"),
      p(
        "Props flow in from the outside; the component doesn't own them and cannot change them. But a quantity stepper has to remember what the user picked, across re-renders, somewhere. That somewhere is state: memory that belongs to this component instance and survives between function calls."
      ),
      code(
        "tsx",
        `import { useState } from "react";
import { PriceTag } from "./PriceTag";

interface ProductCardProps {
  name: string;
  unitPrice: number;
}

export function ProductCard({ name, unitPrice }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <article className="card">
      <h3>{name}</h3>
      <PriceTag amount={unitPrice} />
      <div className="stepper">
        <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
        <span aria-live="polite">{quantity}</span>
        <button onClick={() => setQuantity((q) => q + 1)}>+</button>
      </div>
    </article>
  );
}`,
        "components/ProductCard.tsx"
      ),
      p(
        "useState(1) hands back a pair: the current value and a setter. Calling setQuantity does two things — it stores the new value, and it tells React to re-render this component. Your function runs again from the top, useState now returns the stored value instead of the initial one, and the JSX reflects it. That initial 1 is used exactly once, on the first render. It is not a fallback that reapplies later — remember this, because it explains the bug in the next section."
      ),
      p(
        "The functional update — setQuantity((q) => q + 1) rather than setQuantity(quantity + 1) — matters whenever the next value depends on the previous one. Each updater function receives the latest value, not the possibly stale one your current render closed over. I write the functional form by default in that situation; it removes a whole category of \"why did it only increment once\" mysteries."
      ),
      p(
        "And here is the one-question test I promised, for whether something deserves to be state: does it change over time in a way that nothing else can tell you about? Quantity passes — the user changes it, and no prop or other state knows it. Most other values in a component fail the test."
      ),
      p(
        "Just as important is recognizing what feels like state but belongs elsewhere. Data fetched from the server is a cache, not component memory — your framework's loading mechanism or a query library owns it. A selected tab or an active filter that users should be able to bookmark and share belongs in the URL, which is state storage with a back button. And anything computable from existing values belongs to the next section, because it should not be stored at all."
      ),

      h2("Derive, don't duplicate"),
      p(
        "The card needs a line total — price times quantity. The instinct trained by tutorials is to reach for another useState and keep the total \"in sync.\" Here is that instinct in code, next to what it should be:"
      ),
      code(
        "tsx",
        `// BAD - a second copy of the truth
const [quantity, setQuantity] = useState(1);
const [total, setTotal] = useState(unitPrice);
// every quantity change must now remember to call setTotal too,
// and when the parent lowers unitPrice, total keeps the old value

// GOOD - derived during render, cannot go stale
const [quantity, setQuantity] = useState(1);
const total = quantity * unitPrice;
// render it like any value: <PriceTag amount={total} />`,
        "components/ProductCard.tsx"
      ),
      p(
        "The duplicated version has a mechanical problem and a subtle one. Mechanical: every code path that touches quantity must also update total, forever, including the ones your teammates add next quarter. Subtle: when the parent re-renders with a lower unitPrice — a discount kicked in — total keeps its old value, because state initializers run once, on mount. The card now shows a total that matches nothing, and no single line of code looks wrong on its own. That is what makes stale derived state so miserable to debug."
      ),
      p(
        "The rule that prevents the entire bug class: if a value can be computed from props and existing state, compute it during render. A derived value cannot go stale, needs no synchronization code, and deletes a setter from your component. Keep state for the irreducible facts; let render arithmetic handle the rest."
      ),
      callout(
        "warning",
        "Deeper: the tempting \"fix\" — a useEffect that watches quantity and calls setTotal — is worse than the bug. It renders the stale value first, re-renders after the effect runs, and invites circular update chains as the component grows. If a derivation is genuinely expensive, wrap it in useMemo. And with the React Compiler doing that memoization automatically in current setups (it's enabled in the Next.js 16 codebase this site runs on), the guidance gets even simpler: just compute it."
      ),

      h2("Two components need the same data: lift it up"),
      p(
        "New requirement: a cart indicator in the page header, counting items across every card on the page. Suddenly two components care about quantities — the card that edits them and the header that sums them. State can live in only one place, so it moves up, to the closest component that sits above both. The card's props grow by exactly one callback:"
      ),
      code(
        "tsx",
        `interface ProductCardProps {
  name: string;
  unitPrice: number;
  /** Called with the chosen quantity when the user adds to cart */
  onAddToCart: (quantity: number) => void;
}`,
        "components/ProductCard.tsx"
      ),
      code(
        "tsx",
        `"use client"; // state lives here, so this file is a Client Component

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";

const catalogue = [
  { id: "espresso-cup", name: "Espresso cup", unitPrice: 14 },
  { id: "pour-over-kettle", name: "Pour-over kettle", unitPrice: 89 },
];

export default function ShopPage() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const itemsInCart = Object.values(cart).reduce((sum, n) => sum + n, 0);

  return (
    <main>
      <header>Cart: {itemsInCart}</header>
      {catalogue.map((product) => (
        <ProductCard
          key={product.id}
          name={product.name}
          unitPrice={product.unitPrice}
          onAddToCart={(quantity) =>
            setCart((current) => ({
              ...current,
              [product.id]: (current[product.id] ?? 0) + quantity,
            }))
          }
        />
      ))}
    </main>
  );
}`,
        "app/shop/page.tsx"
      ),
      p(
        "To the card, onAddToCart is just another prop — a function it calls with a number. It has no idea a header exists, which means it stays reusable and stays testable: pass a mock, assert it was called with 2, done. Meanwhile the page owns the cart, derives the item count with a reduce (derive, don't duplicate — it applies at every level), and hands data down while changes flow up. Note what the card kept, too: the quantity stepper is still its own local state, because nothing above needs to watch every click. Lift what is shared, keep the rest local."
      ),
      p(
        "That is the one-way data flow people mean by \"thinking in React\": data down as props, events up through callbacks, one owner per piece of state. The pattern scales further than you might guess. Most pages need nothing beyond state placed at the right level — reach for a store the day lifting genuinely hurts, not the day you learn a store exists."
      ),
      callout(
        "info",
        "Deeper: the same ownership question decides controlled versus uncontrolled inputs. Give an <input> a value plus onChange and React owns it (controlled) — the display can never disagree with your state. Give it only defaultValue and the DOM owns it (uncontrolled) — you read the value when you need it, typically on submit. Both are legitimate; the bugs come from mixing them on one input, which React warns about loudly in the console."
      ),
      callout(
        "tip",
        "In a Next.js 16 App Router project, every component built here is a Client Component — a file that starts with \"use client\". Server Components render on the server and cannot hold useState. The two compose cleanly: server code fetches and passes data down; the interactive leaves of the tree, like this card, are client components."
      ),

      h2("The loop I actually run"),
      p(
        "When a design lands in front of me, the order of operations is always the same, and none of it starts with useState:"
      ),
      ...numbered([
        "Draw boxes on the mock. Every box that repeats, or has its own reason to change, becomes a component.",
        "Build the whole thing static: all props, no state, hard-coded data. If the static version is awkward to assemble, the component boundaries are wrong — fix them now, while it is cheap.",
        "Find the minimal state. For each value that changes, ask the test question: can it be computed from something else? If yes, derive it. What survives should be embarrassingly little.",
        "Place each piece of state in the lowest component that either changes it or sits above everything that does. Wire callbacks for the children that need to report changes.",
      ]),
      p(
        "Static-first feels slow exactly once. Prop design gets debugged while the code is still trivial, TypeScript reviews every connection as you type it, and adding state to a well-shaped static tree is a mechanical step rather than an act of courage. The inverse order — sprinkle useState wherever the UI first needs interactivity, then untangle ownership later — is where the sprawling components you have inherited at every job actually come from."
      ),

      h2("Gotchas that will find you"),
      ...bulletRich([
        [
          "Mutating state: ",
          inlineCode("items.push(item)"),
          " followed by ",
          inlineCode("setItems(items)"),
          " re-renders nothing — it is the same array reference, so React bails out. Always produce a new array or object: ",
          inlineCode("setItems([...items, item])"),
          ".",
        ],
        [
          "Reading state right after setting it: ",
          inlineCode("setQuantity(5)"),
          " then ",
          inlineCode("console.log(quantity)"),
          " prints the old value. The update applies on the next render; your current closure keeps its snapshot. If the next step needs the new value, compute it once in a local const and use that.",
        ],
        [
          "Index as key: fine for a list that never changes, wrong for one that reorders, inserts, or deletes. React matches items across renders by key, and recycled indexes make state stick to the wrong row — the classic \"I deleted item two and item three lost its input.\"",
        ],
        [
          "Prop-drilling panic: passing props through two or three layers is not a problem, it is visible data flow. Context and stores earn their indirection at real depth and real breadth; adopting them at depth two trades grep-ability for nothing.",
        ],
        [
          "Copying a prop into state \"to edit it locally\" is the polite version of the derived-state bug. If you genuinely need a draft, name it as one (",
          inlineCode("draftName"),
          ") and reconcile explicitly on save — the naming alone prevents the confusion.",
        ],
        [
          "Defining a component inside another component's body creates a brand-new function on every render. React sees a different component type each time, unmounts the old one, and remounts — child state resets, inputs lose focus, and nothing errors. Hoist inner components to module scope and pass data via props.",
        ],
      ]),

      h2("Where to go from here"),
      p(
        "Build the card — actually type it out, break it, watch the derived total stay correct while you change quantities and prices. Then grow it: a size selector (state), a discount percentage (derived), a wishlist heart that also lights up in the header (lifted). Every component you will ever write is some remix of those three moves."
      ),
      richP(
        "When lifting state starts to genuinely hurt — the same data needed on distant branches, chains five levels deep — that is the moment for my comparison of ",
        link(
          "Zustand, Redux, and Context for React state management",
          "/blog/react-state-management-in-2025-zustand-vs-redux-vs-context"
        ),
        ". And since props are only as good as their types, ",
        link(
          "TypeScript generics explained with real-world examples",
          "/blog/typescript-generics-explained-with-real-world-examples"
        ),
        " is the natural next step — it is how PriceTag's patterns scale to a whole catalogue of components."
      ),
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 3 · CSS Ecosystem — cycle 1 (2026-07-24)
  // ───────────────────────────────────────────────────────────────────
  {
    title: "Flexbox Mental Models: Stop Guessing align-items",
    excerpt:
      "If you rotate through justify-content and align-items until the layout snaps into place, you're missing one mental model: the two axes. Here it is, plus the min-width fix.",
    categoryName: "CSS Ecosystem",
    tagNames: ["CSS", "TailwindCSS"],
    difficulty: "beginner",
    seoTitle: "Flexbox Explained: align-items vs justify-content",
    seoDescription:
      "align-items and justify-content explained with the flexbox two-axis model — one rule that makes every property predictable, plus the min-width: 0 overflow fix.",
    publishDate: "2026-07-24",
    readingTime: 9,
    imageUrl: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1400&q=80",
    imageAlt: "Rows of colorful umbrellas suspended in neat lines above a street",
    content: [
      p(
        "You want the icon vertically centered next to the label. You type align-items: center — nothing moves. Fine: justify-content: center — now everything is bunched in the middle of the toolbar. You add align-content for luck, throw flex: 1 at a random child, and on the fourth combination the layout snaps into place. You commit quickly, before it changes its mind."
      ),
      p(
        "That ritual is not a memory problem — nobody can memorize properties whose visible effect changes with context. It is a model problem. Flexbox has one idea at its core: two axes, and every property belongs to exactly one of them. Name the axes before you touch the keyboard and the guessing stops. What follows is that model, the sizing story that goes with it, and the one bug — min-width: auto — that bites even people who know both."
      ),
      richP(bold("What you'll walk away with:"), " a flexbox you can predict under deadline pressure."),
      ...bullet([
        "The main-axis/cross-axis rule that gives every flexbox property a single, stable job",
        "What flex-grow, flex-shrink, and flex-basis actually do, told as a story about leftover space",
        "The min-width: auto overflow bug — why your text refuses to truncate, and the one-line fix",
        "A five-step debugging recipe, plus an honest answer to \"should this have been Grid?\"",
      ]),

      h2("Two axes, one rule"),
      p(
        "display: flex turns an element into a flex container and its direct children — only the direct ones — into flex items. The container arranges items along a line called the main axis; the perpendicular direction is the cross axis. With the default flex-direction: row, the main axis runs horizontally (in a left-to-right document) and the cross axis runs vertically."
      ),
      p(
        "Now the rule, which is most of flexbox: justify-content distributes items and spare room along the main axis. The align- properties position things along the cross axis. Justify: main. Align: cross. Every property you have ever guessed at obeys this split, and it is the last time you will need luck to center an icon."
      ),
      p(
        "One more piece of vocabulary and the model is complete. Properties set on the container — justify-content, align-items, flex-direction, gap — are policy for all items at once. A small set lives on the items themselves — flex, align-self, order — and overrides the policy for that item alone. When you cannot find the property that is causing a behavior, you are usually looking at the wrong element of the two."
      ),
      code(
        "css",
        `.toolbar {
  display: flex;                   /* children become flex items     */
  justify-content: space-between;  /* main axis: push the ends apart */
  align-items: center;             /* cross axis: center vertically  */
  gap: 0.75rem;                    /* space between items, not around  */
}`,
        "toolbar.css"
      ),
      ...bulletRich([
        [
          inlineCode("justify-content"),
          " — spreads items and leftover space along the main axis: ",
          inlineCode("flex-start"),
          ", ",
          inlineCode("center"),
          ", ",
          inlineCode("space-between"),
          ", and friends.",
        ],
        [
          inlineCode("align-items"),
          " — positions items along the cross axis: ",
          inlineCode("stretch"),
          " (the default, and the reason flex children fill the row's height), ",
          inlineCode("center"),
          ", ",
          inlineCode("baseline"),
          ".",
        ],
        [inlineCode("align-self"), " — the same job, for one item that disagrees with its siblings."],
        [
          inlineCode("align-content"),
          " — distributes multiple wrapped lines along the cross axis; it does nothing until ",
          inlineCode("flex-wrap"),
          " produces more than one line.",
        ],
      ]),
      callout(
        "warning",
        "There is no justify-self in flexbox. justify-items and justify-self belong to Grid, and pasting them into a flex container does nothing, silently — a classic source of \"CSS is broken\" moments. To push a single item along the main axis, use an auto margin: margin-left: auto on the last toolbar button shoves it to the far edge, because auto margins absorb leftover space before justify-content even gets a look."
      ),

      h2("flex-direction flips the board"),
      p(
        "Here is where the guessing habit is born. flex-direction: column rotates the main axis ninety degrees — and every property's visible effect rotates with it. justify-content: center, which centered horizontally a minute ago, now centers vertically. align-items: center, which centered vertically, now centers horizontally. The properties did not change jobs; the axes they are bound to moved."
      ),
      code(
        "css",
        `.profile-card {
  display: flex;
  flex-direction: column;  /* main axis now runs top to bottom      */
  align-items: center;     /* cross axis is horizontal here, so this
                              centers the avatar and text horizontally */
  gap: 0.5rem;
}`,
        "profile-card.css"
      ),
      p(
        "Run the two examples side by side and the flip is obvious. In the row toolbar, \"center the icons vertically\" was align-items: center. In this column card, the visually identical request — \"center the avatar horizontally\" — is still align-items: center, because in both cases the target is the cross axis. Same property, same axis, rotated picture. The developers who guess are the ones translating from visual directions; the ones who don't are translating from axes."
      ),
      p(
        "If you learned align-items as \"the vertical one,\" column layouts will betray you weekly. Learn it as \"the cross-axis one\" and nothing changes when the direction does. My habit, and I mean this literally: before touching an alignment property, I say the direction out loud — \"column, so main is vertical\" — and only then pick the property. It feels silly for about a week. It works forever."
      ),
      callout(
        "info",
        "Deeper: the axes are logical, not physical. flex-direction: row follows the document's writing direction, so in a right-to-left page, row runs right to left and flex-start means the right edge. This is why modern CSS leans on logical properties (margin-inline-start over margin-left) and gap: layouts built that way follow the language instead of fighting it."
      ),

      h2("Centering, deterministically"),
      p(
        "The joke about centering a div outlived the problem by a decade. Two patterns cover practically every case, and the second one is less known but sturdier:"
      ),
      code(
        "css",
        `/* Everyday version: center everything in the container */
.hero {
  display: flex;
  justify-content: center;  /* main axis  */
  align-items: center;      /* cross axis */
  min-height: 100svh;
}

/* Single child: auto margins absorb space on all four sides */
.overlay {
  display: flex;
  min-height: 100svh;
}
.overlay > .dialog {
  margin: auto;
}`,
        "centering.css"
      ),
      p(
        "The margin: auto version earns its keep at the edges: when the dialog grows taller than the container, auto margins let it align to the top and remain scrollable, while align-items: center pushes the overflow off the top of the screen where no scrollbar can reach it. For modals and any content of unpredictable height, auto margins are the tool I trust."
      ),

      h2("grow, shrink, basis: the leftover-space story"),
      p(
        "Flex sizing stops being mysterious the moment you tell it as a story about leftover space. Every item starts at its flex-basis — auto by default, which means its content size, or its explicit width if one is set. The browser lines the items up, adds the gaps, and compares the total against the container. Room to spare is a surplus; not enough is a deficit."
      ),
      p(
        "flex-grow decides how a surplus is shared: an item with grow: 2 takes twice the extra space of an item with grow: 1, and the default of 0 takes none. flex-shrink decides how a deficit is absorbed, with one wrinkle — shrinking is weighted by basis, so larger items give up more pixels than smaller ones. The default combination, 0 1 auto, reads as: start at content size, never grow, shrink if you must."
      ),
      code(
        "css",
        `/* Classic app shell: fixed rail, flexible content */
.shell {
  display: flex;
  gap: 1rem;
}
.sidebar {
  flex: 0 0 16rem;  /* no grow, no shrink, start at 16rem */
}
.content {
  flex: 1;          /* 1 1 0% - claim all leftover space  */
}`,
        "shell.css"
      ),
      ...bulletRich([
        [
          inlineCode("flex: 1"),
          " expands to ",
          inlineCode("1 1 0%"),
          ": basis zero, so content size stops mattering and pure grow ratios divide the space. Three ",
          inlineCode("flex: 1"),
          " siblings are three equal columns, whatever is inside them.",
        ],
        [
          inlineCode("flex: auto"),
          " is ",
          inlineCode("1 1 auto"),
          ": start from content size, then share the surplus — bigger content keeps a bigger share. Right for toolbars; wrong for equal columns.",
        ],
        [
          inlineCode("flex: none"),
          " is ",
          inlineCode("0 0 auto"),
          ": the item is exactly its size, come what may. Icons, avatars, anything that must not squish.",
        ],
        [
          "A bare ",
          inlineCode("flex-grow: 1"),
          " keeps ",
          inlineCode("flex-basis: auto"),
          " — content size still counts, which is why the \"equal\" columns you made with it come out unequal. This one line answers most equal-column bug reports I have ever seen.",
        ],
      ]),
      p(
        "To make the story concrete, run the shell above in your head at a width of 60rem. The sidebar claims its 16rem basis, the gap takes 1rem, and the content starts at basis 0% — so the leftover space is everything else, 43rem, and the content's grow: 1 claims all of it. Narrow the window and the content simply receives less leftover, down to the point where only the fixed sidebar and the gap remain; past that the row overflows, because nothing left in it is allowed to shrink. Surplus or deficit, starting sizes plus one round of sharing — that is the entire algorithm."
      ),
      callout(
        "tip",
        "Deeper: prefer the flex shorthand over individual longhands. flex: 1 deliberately resets basis to 0%, while a lone flex-grow: 1 inherits whatever basis was already in play — two declarations that look interchangeable and behave nothing alike. When the math still surprises you, the flex inspector in Chrome or Firefox DevTools shows each item's basis against its final size, which turns arguments with your layout into arithmetic."
      ),

      h2("The bug you will actually hit: min-width: auto"),
      p(
        "The layout works for weeks. Then a user pastes a long URL into a chat message, or a product name arrives with no spaces, and one flex item blows the row wide open — the page grows a horizontal scrollbar, and the text-overflow: ellipsis you are certain you wrote does nothing at all. This is the most-reported flexbox bug in existence, and it is not a bug."
      ),
      p(
        "By specification, a flex item's minimum size defaults to min-content — roughly, wide enough for its longest unbreakable word. flex-shrink is not allowed to squeeze an item below that floor. So the message bubble refuses to get narrower than the URL inside it, and because it never shrinks, it overflows instead. The ellipsis never fires because, as far as the item is concerned, it never ran out of room."
      ),
      code(
        "css",
        `.chat-row {
  display: flex;
  gap: 0.5rem;
}
.avatar {
  flex: none;
}
.message {
  flex: 1;
  min-width: 0;   /* THE fix: allow shrinking below content size */
}
.message .preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;  /* now this can actually fire */
}`,
        "chat-row.css"
      ),
      p(
        "min-width: 0 removes the floor, the item can finally shrink, and the truncation machinery works as written. Setting overflow: hidden on the item resets the automatic minimum too, if that reads more naturally in context. Column layouts have the identical trap spelled min-height: auto — the chat log that refuses to scroll and stretches the whole page instead is the same bug rotated ninety degrees."
      ),
      p(
        "Learn to recognize the shapes it wears: breadcrumbs that push the page wide, file names overflowing a table cell, a code block or input inside a flex parent, card titles without spaces breaking a grid of tiles. Any time a flex layout survives your test data and dies on real content, put money on the automatic minimum before investigating anything else."
      ),
      callout(
        "tip",
        "Writing Tailwind? Everything here maps one to one: flex, items-center, justify-between, flex-1, shrink-0, gap-4 — and, crucially, min-w-0. That utility exists precisely because of this bug. Needing it is normal, not a hack, and knowing why it exists is the difference between using it and cargo-culting it."
      ),

      h2("A five-step debugging recipe"),
      p(
        "When a flex layout misbehaves, changing properties at random eventually works and teaches you nothing. This sequence finds the cause instead, and it is ordered by how often each step is the answer:"
      ),
      ...numbered([
        "Make the boxes visible. Outline everything (see below), or click the flex badge next to the container in the Elements panel — the overlay draws the lines and the leftover space for you.",
        "Name the axes. Find the container's flex-direction and say it out loud: \"row, so justify is horizontal here.\" Half of all flexbox confusion dies at this step.",
        "Account for the leftover space. A mystery gap is unclaimed surplus: check justify-content, check for auto margins, and check which items carry flex-grow.",
        "If something overflows or will not truncate, assume min-width: auto until proven otherwise. Drop min-width: 0 on the suspect item and watch what changes.",
        "If wrapping is on, remember that lines move as a group with align-content while items move within their line via align-items — \"centering does nothing\" reports are usually this.",
      ]),
      code(
        "css",
        `/* Temporary X-ray: outline doesn't shift layout like border does */
* {
  outline: 1px solid rgb(255 0 0 / 0.35);
}`,
        "debug.css"
      ),
      p(
        "The outline trick sounds primitive next to DevTools overlays, but it shows every box at once — including the wrapper div you forgot existed, which is the actual culprit more often than I would like to admit."
      ),

      h2("When you're fighting flexbox, it's probably a grid"),
      p(
        "Flexbox is content-out: items take their natural size and the algorithm negotiates from there, one line at a time. Even when it wraps, each line lays out independently — items on line two do not align with items on line one. Grid is the opposite, layout-in: you declare the tracks first, and content slots into a structure that stays aligned in both dimensions."
      ),
      p(
        "The tell is in your own CSS. Percentage widths with calc() carve-outs to fake columns, or a wrapped flex \"grid\" of cards whose rows never quite line up — that is Grid's job being done badly with flex. A navbar, a media row of avatar-text-actions, a tag list, a centering job: those are flexbox, and Grid would be ceremony. My working rule: flexbox when content should decide the sizes along one axis, Grid the moment I care about alignment across two. The two also nest happily — a Grid page shell with flex toolbars inside its cells is the normal shape of a production layout, not a compromise."
      ),

      h2("More gotchas worth knowing"),
      ...bulletRich([
        [
          inlineCode("align-items: stretch"),
          " being the default is why cards in a row come out equal height for free — and why setting an explicit height on one child quietly turns that magic off for it.",
        ],
        [
          "Margins do not collapse inside a flex container. Two stacked paragraphs that shared overlapping margins in normal flow suddenly sit further apart — switch to ",
          inlineCode("gap"),
          " and stop reasoning about margin collapse entirely.",
        ],
        [
          inlineCode("position: absolute"),
          " removes an item from flex layout altogether — no growing, no shrinking, no order. Useful for badges pinned to a card corner; alarming when it happens by accident.",
        ],
        [
          "For a row mixing font sizes — a large price next to small fine print — ",
          inlineCode("align-items: baseline"),
          " beats ",
          inlineCode("center"),
          ": centered text of different sizes looks slightly off forever, and baseline is what your eye actually wants.",
        ],
        [
          "An empty flex container with ",
          inlineCode("justify-content: space-between"),
          " and one child pins that child to the start, not the center — with a single item there is no \"between.\" Auto margins or ",
          inlineCode("center"),
          " are what you meant.",
        ],
      ]),

      h2("Where to go from here"),
      p(
        "Take the axis rule to your current codebase and retire some guesses: find one layout you never quite trusted, name its container's axes, and re-express it deliberately. Ten minutes of that is worth more than any reference table, and the two-axis vocabulary transfers almost entirely to Grid, where it grows into explicit rows and columns."
      ),
      richP(
        "When you hit the two-dimensional cases from the last section, my ",
        link("complete visual guide to CSS Grid", "/blog/css-grid-layout-the-complete-visual-guide"),
        " picks up exactly where flexbox hands over. And if your day-to-day is utility classes, ",
        link("Mastering Tailwind CSS", "/blog/mastering-tailwind-css-from-basics-to-advanced-patterns"),
        " shows these same patterns — min-w-0 included — as they show up in production Tailwind code."
      ),
    ],
  },
];

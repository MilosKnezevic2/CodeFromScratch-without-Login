/**
 * Content wave — cycle 1, part d (docs/CONTENT-PLAN.md).
 * Testing C10-1 (2026-08-10) and Performance C11-1 (2026-08-12).
 */
import {
  p,
  h2,
  h3,
  code,
  callout,
  bold,
  inlineCode,
  link,
  richP,
  bullet,
  bulletRich,
  numbered,
} from "./pt.mjs";

export const posts = [
  {
    title: "Vitest From Zero: Fast Unit Tests for Modern TypeScript Projects",
    excerpt:
      "You know you should be testing. Here is the afternoon it finally happens: Vitest installed and configured for strict TypeScript, a real utility under test, and your first honest mock.",
    categoryName: "Testing",
    tagNames: ["Jest & Vitest", "TypeScript"],
    difficulty: "beginner",
    seoTitle: "Vitest Tutorial for TypeScript: Fast Unit Tests From Zero",
    seoDescription:
      "A hands-on Vitest tutorial for TypeScript: install and configure Vitest 3, write real tests with describe and expect, mock fetch with vi.fn, read failures.",
    publishDate: "2026-08-10",
    readingTime: 11,
    imageUrl:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1400&q=80",
    imageAlt: "Laptop screen filled with colorful lines of code in a dimly lit room",
    content: [
      p("There is a ritual I want to describe, and I want you to be honest about whether you recognize it. You write a small utility — say, a function that turns article titles into URL slugs. You open the browser console, paste the function in, feed it three inputs, squint at the output, nod, and ship."),
      p("Three weeks later someone publishes a post called 'Café au lait: a pour-over story' and the page 404s, because your function turned the é into a dash and the link into garbage. You fix it — checking in the console again — and ship again. A month later a refactor quietly undoes the fix, and nobody notices until it is live. The console ritual is testing with amnesia: every check you perform evaporates the moment you close the tab."),
      p("I put off writing tests for years, partly because every tutorial opened by proving that adding one and two gives three, and I could not see what that had to do with my actual bugs. This is the tutorial I wish I had read instead: Vitest, in a strict TypeScript project, testing a real function with real edge cases — accents, emoji, empty input — plus the one mock you genuinely need. Setup takes about five minutes."),
      richP(bold("What you'll walk away with:"), " everything you need to go from zero tests to a small suite you actually run."),
      ...bullet([
        "A Vitest 3 setup for a strict TypeScript project, path alias included",
        "The describe / it / expect anatomy, learned on a slugify function with honest edge cases",
        "Your first mock with vi.fn, and a clear rule for when mocking is the right call",
        "A watch-mode workflow that makes tests something you run constantly, not something you dread",
      ]),

      h2("What a unit test is, and why Vitest"),
      p("A unit test is a tiny program that calls one piece of your code with known inputs and checks the result against what you expected. That is the entire concept. The power is not in any single check — the console gave you that — it is in permanence: every test keeps re-running its check on every change, forever, for free."),
      richP("Vitest is a ", bold("test runner"), ": the tool that finds those test files, executes them, and reports results. It is not the only one — Jest is the long-standing default, and the two APIs are so close that nearly everything below works in both. I reach for Vitest on TypeScript projects for a practical reason: it understands TypeScript and modern ES modules natively, while Jest needs a transform layer (ts-jest or Babel) that you have to configure and keep in sync with your compiler settings. With Vitest there is no compile step to babysit; it runs ", inlineCode(".ts"), " files as they are, and it runs them fast."),
      p("Everything here is Vitest 3 on Node 22, in a project with TypeScript strict mode on. Nothing requires React or a browser — we are testing plain functions, which is where I think everyone should start."),

      h2("Setup: one dependency, one config file"),
      p("Install the single dev dependency:"),
      code("bash", `npm install -D vitest`, "terminal"),
      richP("Then give yourself two scripts in ", inlineCode("package.json"), " — one for machines, one for humans:"),
      code("json", `{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}`, "package.json"),
      richP(inlineCode("vitest run"), " executes the suite once and exits — what CI and pre-commit hooks want. Plain ", inlineCode("vitest"), " starts watch mode, which we will get to, because it is the feature that actually changes your habits."),
      richP("You could stop configuring here; Vitest works with zero config. In practice, TypeScript projects hit one need immediately: the path alias. If your imports read ", inlineCode("@/lib/slugify"), " instead of ", inlineCode("../../lib/slugify"), " — the ", inlineCode("@"), " standing for your source root — Vitest has to be told, because that mapping lives in your bundler and tsconfig, not in Node itself:"),
      code("ts", `import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
  },
});`, "vitest.config.ts"),
      code("json", `{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`, "tsconfig.json"),
      richP("Two notes. The alias must say the same thing in both files — keep them in sync, or your editor and your test runner will disagree about whether an import exists. And ", inlineCode('environment: "node"'), " is already the default; I state it because it is a decision: plain functions run in Node, while component tests need a DOM emulation like jsdom — a topic for the React testing piece linked at the end."),
      callout("tip", "Deeper: if the project already has a vite.config.ts, you do not need a second config file. Import defineConfig from vitest/config there instead and add the test block next to your existing options — Vitest reads Vite's config natively."),

      h2("The function we will test"),
      p("Meet the subject. It powers every article URL on a blog like this one: title in, slug out. The requirements sound trivial until you enumerate them: lowercase everything; flatten accents so 'Café' becomes cafe, not caf; collapse every run of spaces and punctuation into one dash; never start or end with a dash; and if nothing usable remains — an all-emoji title will happen eventually — fail loudly rather than return an empty string, because an empty slug means a page published at /blog/ and a deeply confusing bug report."),
      code("ts", `export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD") // split "é" into "e" plus a combining accent mark
    .replace(/[\\u0300-\\u036f]/g, "") // drop the accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of anything else becomes one dash
    .replace(/^-+|-+$/g, ""); // no leading or trailing dashes

  if (slug.length === 0) {
    throw new Error(\`Cannot build a slug from "\${title}"\`);
  }

  return slug;
}`, "src/lib/slugify.ts"),
      p("Each line earns its place, and each line is something a future edit can silently break. That makes it a perfect first test subject: pure (same input, same output, no network or database), genuinely fiddly, and representative — next week you will be testing your own utilities, not mine."),

      h2("The anatomy of a test: describe, it, expect"),
      richP("The test file sits next to the source file — ", inlineCode("slugify.test.ts"), " beside ", inlineCode("slugify.ts"), ". Vitest picks up anything ending in ", inlineCode(".test.ts"), " or ", inlineCode(".spec.ts"), " automatically, no configuration needed:"),
      code("ts", `import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("collapses runs of punctuation into one dash", () => {
    expect(slugify("What's new -- in 2026?!")).toBe("what-s-new-in-2026");
  });

  it("flattens accented characters", () => {
    expect(slugify("Café au lait")).toBe("cafe-au-lait");
  });
});`, "src/lib/slugify.test.ts"),
      p("Three pieces of vocabulary and you are fluent:"),
      ...bulletRich([
        [inlineCode("describe"), " groups related tests under a label. One describe per function is a fine default."],
        [inlineCode("it"), " declares a single test, and its name completes a sentence: it lowercases and joins words with dashes. When this fails six months from now, that sentence is the bug report."],
        [inlineCode("expect"), " wraps the value your code produced; the method chained onto it — called a ", bold("matcher"), " — states what should be true about it. ", inlineCode("toBe"), " means: exactly this value."],
      ]),
      richP("Run the suite once with ", inlineCode("npx vitest run"), ":"),
      code("text", ` ✓ src/lib/slugify.test.ts (3 tests) 3ms

 Test Files  1 passed (1)
      Tests  3 passed (3)`, "output"),
      p("Three checks in a few milliseconds — and unlike the console ritual, they are now permanent."),

      h2("The assertions that matter: toBe, toEqual, toThrow, async"),
      richP(inlineCode("toBe"), " checks identity — the right tool for strings, numbers, and booleans. The moment a function returns an object or an array, switch to ", inlineCode("toEqual"), ", which compares shape and contents instead. This distinction bites everyone exactly once: two arrays holding identical items are still two different objects, so ", inlineCode("toBe"), " fails on them even when your code is correct."),
      p("To see it, here is a second small utility — parsing the comma-separated tags field of a CMS form — along with its tests:"),
      code("ts", `export function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}`, "src/lib/parse-tags.ts"),
      code("ts", `import { describe, expect, it } from "vitest";
import { parseTags } from "@/lib/parse-tags";

describe("parseTags", () => {
  it("splits, trims, and lowercases", () => {
    expect(parseTags(" React,  TypeScript ,testing")).toEqual([
      "react",
      "typescript",
      "testing",
    ]);
  });

  it("drops empty entries left by stray commas", () => {
    expect(parseTags("react,,")).toEqual(["react"]);
  });
});`, "src/lib/parse-tags.test.ts"),
      richP("Swap that first ", inlineCode("toEqual"), " for ", inlineCode("toBe"), " and run it: the values match, the references do not, and the failure message notes it compared with Object.is — your cue that you wanted ", inlineCode("toEqual"), " all along."),
      richP("Then there is the error path. Remember that ", inlineCode("slugify"), " throws on unusable input; that behavior deserves a test as much as the happy path does:"),
      code("ts", `it("throws when nothing usable remains", () => {
  expect(() => slugify("🔥🔥🔥")).toThrow(/cannot build a slug/i);
});`, "src/lib/slugify.test.ts"),
      richP("Note the arrow function. If you called ", inlineCode("slugify"), " directly inside the parentheses, it would throw while the argument was being evaluated — before ", inlineCode("toThrow"), " could catch anything — and the test would error instead of pass. Hand ", inlineCode("expect"), " a function, and the matcher can invoke it safely inside its own try/catch. Passing a regex pins the message loosely, so rewording the error later does not break the test."),
      richP("Async code gets async tests: make the ", inlineCode("it"), " callback ", inlineCode("async"), " and ", inlineCode("await"), " inside it, or use the ", inlineCode("resolves"), " and ", inlineCode("rejects"), " helpers you will meet in the mock section. Vitest waits for the returned promise either way."),
      callout("info", "Deeper: typed test helpers. Once several tests need the same fixture — sample data such as a fake Post object — resist copy-pasting object literals. Write a builder: function makePost(overrides: Partial<Post> = {}): Post { return { ...defaultPost, ...overrides }; }. Because it returns a real Post, adding a required field to the type breaks one builder at compile time instead of forty tests at run time. Strict TypeScript quietly makes your suite refactor-proof."),

      h2("Watch mode is the actual workflow"),
      richP("Here is the part that converts people. Start Vitest ", bold("without"), " ", inlineCode("run"), " and leave it alone:"),
      code("bash", `npx vitest`, "terminal"),
      p("It executes the suite once, then watches. Save any file and it re-runs — only the tests affected by what you changed, usually in well under a second. My setup while writing a utility is the editor and that terminal side by side: write a failing test, save, watch it fail; implement, save, watch it go green. Not test-driven development as ideology — just a feedback loop tight enough that checking your work stops being a decision and becomes ambient."),
      richP("The watch terminal is interactive — press ", inlineCode("h"), " for the menu. The commands I actually use: ", inlineCode("p"), " filters by filename, ", inlineCode("t"), " filters by test name, ", inlineCode("a"), " re-runs everything, ", inlineCode("q"), " quits. Filtering matters more than it sounds: once a suite has a few hundred tests, ", inlineCode("t slugify"), " scopes the loop to the one thing you are working on."),
      richP("In CI, use the other script: ", inlineCode("npm test"), " maps to ", inlineCode("vitest run"), " — one pass, an exit code, done. Vitest also detects CI environments and disables watch mode on its own, but being explicit costs nothing."),
      callout("tip", "Deeper: time-dependent code. Functions that compute '3 days ago' or debounce input are untestable against the real clock — never sleep in a test; fake the time instead. vi.useFakeTimers() takes over the clock, vi.setSystemTime(new Date('2026-08-10')) pins what 'now' means, and vi.advanceTimersByTime(3000) fires three seconds of pending setTimeout callbacks instantly. Restore with vi.useRealTimers() in afterEach, or the frozen clock leaks into the next test."),

      h2("Where test files live"),
      p("You have seen my answer already: next to the code. Co-location keeps the test one keystroke away, keeps its imports short, and means a module and its tests travel together through every rename, move, and deletion — when a directory of code goes, its tests do not linger as orphans."),
      richP("The alternative — a mirrored ", inlineCode("__tests__/"), " tree — is not wrong, and Vitest finds either without configuration. In my experience mirrored trees rot faster: their structure drifts from the source tree, and out of sight becomes out of date. Pick one convention per repository and hold it in review; the only bad option is both."),

      h2("Your first mock: vi.fn, and why you would fake fetch"),
      p("So far every function was pure: input in, output out, no outside world. Now the honest case. Before publishing, the CMS asks the server whether a slug is already taken:"),
      code("ts", `export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const res = await fetch(\`/api/slugs/\${encodeURIComponent(slug)}\`);

  if (!res.ok) {
    throw new Error(\`Slug check failed with status \${res.status}\`);
  }

  const data = (await res.json()) as { taken: boolean };
  return !data.taken;
}`, "src/lib/check-slug.ts"),
      richP("A unit test must not actually call ", inlineCode("fetch"), ". The network is slow, flaky, and absent in CI — and this test is about ", bold("your"), " logic (the ok check, the negation, the URL), not the server's. The tool for the job is a ", bold("mock"), ": a stand-in function that records how it was called and returns whatever you script. ", inlineCode("vi.fn()"), " creates one; ", inlineCode("vi.stubGlobal()"), " swaps it in for the real global ", inlineCode("fetch"), ":"),
      code("ts", `import { afterEach, describe, expect, it, vi } from "vitest";
import { checkSlugAvailable } from "@/lib/check-slug";

describe("checkSlugAvailable", () => {
  afterEach(() => {
    vi.unstubAllGlobals(); // put the real fetch back
  });

  it("returns true when the API reports the slug is free", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ taken: false }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fakeFetch);

    await expect(checkSlugAvailable("my-new-post")).resolves.toBe(true);
    expect(fakeFetch).toHaveBeenCalledWith("/api/slugs/my-new-post");
  });

  it("throws when the API is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    await expect(checkSlugAvailable("my-new-post")).rejects.toThrow(/status 500/);
  });
});`, "src/lib/check-slug.test.ts"),
      richP("Reading it top to bottom: ", inlineCode("mockResolvedValue"), " scripts the fake — when called, resolve with this ", inlineCode("Response"), " (Node 22 ships the Response constructor, so the fake returns exactly what real fetch would). ", inlineCode("stubGlobal"), " performs the swap. The two ", inlineCode("await expect"), " lines are the async matchers from earlier: ", inlineCode("resolves"), " unwraps a promise before asserting, ", inlineCode("rejects"), " asserts that it fails. And ", inlineCode("toHaveBeenCalledWith"), " is the mock's memory — proof your code built the URL correctly, which is precisely the kind of thing that breaks silently."),
      richP("The ", inlineCode("afterEach"), " — a hook that runs after every test in the file — is not decoration. A stubbed global outlives the test that stubbed it; skip the cleanup and some unrelated test inherits your fake fetch, producing the classic symptom: tests that pass alone and fail together. Restore in ", inlineCode("afterEach"), ", always."),
      richP("As for ", bold("when"), " to mock, my rule: mock at the boundary where your code ends and the world begins — network, clock, file system, database. Do not mock your own pure functions; ", inlineCode("slugify"), " is fast and deterministic, so any test that needs it can call the real thing. And when a function seems to require five mocks, that is not a testing problem — it is the function telling you it does too much."),

      h2("Reading a failure properly"),
      richP("A failing test is the product working. Say a future refactor 'simplifies' ", inlineCode("slugify"), " and drops the ", inlineCode("normalize"), " line. Watch mode goes red:"),
      code("text", ` FAIL  src/lib/slugify.test.ts > slugify > flattens accented characters
AssertionError: expected 'caf-au-lait' to be 'cafe-au-lait' // Object.is equality

Expected: "cafe-au-lait"
Received: "caf-au-lait"

 ❯ src/lib/slugify.test.ts:16:37
     15|   it("flattens accented characters", () => {
     16|     expect(slugify("Café au lait")).toBe("cafe-au-lait");
       |                                     ^`, "output"),
      p("Read it in this order. First the header line: the file, then the describe and it names — the sentence you wrote earlier is now telling you exactly which promise broke. Second, Expected versus Received: the é became a dash instead of an e, which says the accent flattening is gone — that is a diagnosis, and you have not opened a single file yet. Third, the code frame: it points at the assertion that failed, which is usually not where the bug lives; the bug is in the code under test. Jump there — or press t in the watch terminal and iterate on just this test until it is green again."),

      h2("Gotchas: where this bites you"),
      p("Everything above works as described. Here is what goes wrong in real projects anyway."),
      ...bulletRich([
        [bold("toBe on objects."), " The failure shows two identical-looking values and feels like the runner is gaslighting you. It is comparing references. Use ", inlineCode("toEqual"), " for anything non-primitive."],
        [bold("Alias drift."), " The ", inlineCode("@"), " alias lives in two places — vitest.config.ts and tsconfig.json — and nothing forces them to agree. When they drift, either the editor flags imports the runner resolves, or tests fail on imports the editor accepts. Update both or neither."],
        [bold("Leaky test state."), " Stubbed globals, fake timers, and mocks all outlive their test unless restored. If the suite passes file by file but fails as a whole, hunt for a missing ", inlineCode("afterEach"), " — or set ", inlineCode("restoreMocks: true"), " and ", inlineCode("unstubGlobals: true"), " in the config and make cleanup automatic. I recommend both."],
        [bold("Testing implementation instead of behavior."), " Asserting that an internal helper was called twice welds the test to today's code shape; the refactor that improves the code kills the test. Assert on outputs and observable effects, and save ", inlineCode("toHaveBeenCalledWith"), " for real boundaries like the fetch above."],
        [bold("Vitest and Jest look alike until they do not."), " With Vitest you import ", inlineCode("describe"), ", ", inlineCode("it"), ", ", inlineCode("expect"), ", and ", inlineCode("vi"), " from ", inlineCode('"vitest"'), " unless you enable ", inlineCode("globals: true"), " in the config. Copy-pasting Jest examples that assume ambient globals is the classic first-day error."],
      ]),

      h2("Where to go from here"),
      p("Do not try to write a thousand tests this week. Adopt one habit instead: every utility you write or touch gets a test file with the same care, and every bug you fix gets a regression test proving it stays fixed — written before the patch, so you watch it go from red to green. That single habit compounds into a suite that guards exactly the code you depend on most."),
      richP("When you are ready to test components rather than functions — rendering, clicks, async UI — ", link("Testing React Applications: A Complete Strategy", "/blog/testing-react-applications-a-complete-strategy"), " covers the layer above this one. And if the typed builder from the helpers callout intrigued you, ", link("TypeScript Generics Explained with Real-World Examples", "/blog/typescript-generics-explained-with-real-world-examples"), " is the piece that makes ", inlineCode("Partial<Post>"), " and friends click."),
    ],
  },

  {
    title: "Measuring Before Optimizing: Lighthouse, WebPageTest, and Real-User Data",
    excerpt:
      "Most performance work fails before it starts, because nobody measured. Learn lab versus field data, a Lighthouse routine you can trust, waterfall reading, and a 15-minute habit.",
    categoryName: "Performance",
    tagNames: ["Web Performance & Core Web Vitals", "SEO & Technical SEO"],
    difficulty: "beginner",
    seoTitle: "How to Measure Website Performance Properly (Lab + Field)",
    seoDescription:
      "How to measure website performance properly: run Lighthouse for numbers you can trust, read WebPageTest waterfalls, and find real-user Core Web Vitals free.",
    publishDate: "2026-08-12",
    readingTime: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&q=80",
    imageAlt: "Racks of servers in a data center wired with bundles of network cables",
    content: [
      p("Picture this: you give a whole weekend to performance work. Images converted to AVIF, the dashboard code-split, a heavy date library swapped for three lines of Intl. On Monday you run Lighthouse to collect your reward — and the score went from 71 to 73. Two points. You cannot even be sure they came from your changes — the next run says 70."),
      p("Nothing in that weekend was bad work. It was unmeasured work. The most common performance mistake is not a missing preload or an oversized image — it is optimizing a page you never profiled, so the effort lands wherever intuition pointed. I have made this mistake with every technique in the book, and the cure was never a smarter fix — it was a boring order of operations: measure, change one thing, measure again."),
      richP(bold("What you'll walk away with:"), " a complete measurement kit that costs nothing."),
      ...bullet([
        "The lab-versus-field distinction, and why a clean lab score can coexist with miserable real users",
        "A Lighthouse routine — incognito, mobile preset, several runs — that beats the score lottery",
        "The ability to read one WebPageTest waterfall row: DNS, connect, TLS, wait, download",
        "Free sources of real-user Core Web Vitals, plus a before-and-after ritual for every change",
      ]),

      h2("Two kinds of truth: lab data and field data"),
      p("Every performance number belongs to one of two families, and confusing them is where most wasted effort starts."),
      richP(bold("Lab data"), " (also called synthetic) is produced by a tool loading your page once, in a controlled environment: one machine, one simulated network, one visit, no user. Lighthouse is lab data. Its virtue is reproducibility — run it before and after a change and the difference is attributable. Its limit is that it describes a visitor who does not exist."),
      richP(bold("Field data"), " is aggregated from real visits: mid-range Androids on bus Wi-Fi, iPhones on the metro, desktops on fiber, every mix of cold and warm cache. Its virtue is truth — this is what people actually experienced. Its limits are lag and fuzz: it arrives averaged over weeks, and you cannot re-run reality to isolate one change."),
      p("You need both, in a specific relationship: field data decides whether there is a problem and whether you truly fixed it; lab data is the microscope for finding the mechanism in between. Lab tells you why. Field tells you whether."),
      p("The field metrics that matter most are the three Core Web Vitals. LCP, Largest Contentful Paint: how long until the biggest piece of content is visible — good is within 2.5 seconds. INP, Interaction to Next Paint: how quickly the page responds when people click, tap, or type — good is within 200 milliseconds. (INP replaced the older FID metric in 2024; a tutorial that still says FID is dated.) CLS, Cumulative Layout Shift: how much the layout jumps around while loading — good is under 0.1. Each is judged at the 75th percentile of visits — the page must be good for three quarters of real users, not on average."),
      callout("warning", "Deeper: INP does not exist in your Lighthouse score. A lab run barely interacts with the page, so there is nothing to measure; the lab stand-in is Total Blocking Time (TBT) — how long the main thread was too busy to respond during load. Low TBT usually predicts decent INP, but only loosely — a page can load lean and still jank on every click. When field INP is failing and the lab looks clean, believe the field."),

      h2("Lighthouse, run so the number means something"),
      p("Lighthouse is the audit tool built into Chrome DevTools, PageSpeed Insights, and half the performance products on the internet. Run casually, it is a random-number generator with a nice UI; the difference between that and a real measurement is four habits."),
      ...bulletRich([
        [bold("Go incognito."), " Extensions inject scripts and styles into every page you audit, and they bill their cost to your score."],
        [bold("Mobile preset first."), " It emulates a mid-range phone on a slow connection — a simulated slow-4G network plus roughly a 4x CPU slowdown. That feels punishing, which is the point: your machine is the least representative device that will ever open your site."],
        [bold("Audit the deployed site, not localhost."), " Dev servers skip minification, compression, and image optimization, and there is no CDN in front of your laptop. Audit the real deployment or a production-mode preview, or you are profiling a build nobody receives."],
        [bold("Run three to five times and keep the median."), " The score moves between runs — more on why in a second — so one run before and one run after cannot be compared. Medians can."],
      ]),
      p("Why does the score wobble? Because the measurement shares a computer with everything else you run: background processes steal CPU, the network jitters, and the page itself may differ between loads — rotating heroes, experiments, third-party tags. A two-point move is noise, not signal — reach for medians before celebrating."),
      p("For repeatable runs outside DevTools, the CLI is worth knowing:"),
      code("bash", `# audits with mobile defaults, then opens the HTML report
npx lighthouse https://your-site.example --view

# desktop preset, for the second perspective
npx lighthouse https://your-site.example --preset=desktop --view`, "terminal"),
      p("Or outsource the consistency problem entirely: PageSpeed Insights (pagespeed.web.dev) runs Lighthouse on Google's servers — controlled hardware, no extensions — and prints real-user field data above the lab result — more on that shortly."),
      h3("Reading the report beyond the score"),
      p("The performance score is a weighted blend of five lab metrics — Total Blocking Time alone carries 30 percent in current Lighthouse versions, LCP 25 — and nothing else. The audit lists below it do not feed the score; they explain it."),
      richP("Those lists come in two flavors people conflate. ", bold("Opportunities"), " carry estimated savings — 'Properly size images, est. 1.2 s'. The estimates are modeled, not promised, and they do not add up, because loading overlaps: two one-second opportunities rarely buy two seconds. ", bold("Diagnostics"), " have no savings number at all; they are context for your investigation, like the main-thread breakdown or which element was the LCP. Read opportunities as ranked hypotheses and diagnostics as evidence."),
      richP("The most underrated element is the ", bold("filmstrip"), " — the row of screenshots of the page loading. Metrics compress the experience into numbers; the filmstrip is the experience: how long the screen stayed blank, when the headline appeared, what jumped. If LCP is bad, the filmstrip usually names the guilty element before any audit does."),
      p("My reading order is always the same: metrics first (which of LCP, TBT, CLS is actually bad), filmstrip second (what was on screen during the bad part), opportunities last (which suggestions plausibly touch that metric). That order once stopped me spending a day on image optimization for a page whose real problem was the server taking ages to send the first byte — time to first byte, TTFB, which the next tool dissects properly."),
      callout("info", "Deeper: not all throttling is the same kind of simulation. Lighthouse's default is simulated throttling: it observes a fast load, then mathematically models how it would have gone on a slow network — quick, but a model. DevTools throttling really delays traffic, applied inside the browser; WebPageTest shapes traffic at the packet level, closest to a genuinely bad network. Same page, three philosophies, three different numbers — never compare results across tools, only within one."),

      h2("WebPageTest: the waterfall is the story"),
      p("webpagetest.org has been the profession's reference tool for well over a decade, and the free tier is enough: pick a location, a browser, a connection speed, and run. What comes back — beyond metrics — is the waterfall: one row per requested resource, time along the x-axis, each row split into the phases of that request."),
      p("Waterfalls look intimidating and are not: learn to read one row, and every other row is the same grammar."),
      h3("One row, five phases"),
      code("text", `your-site.example  |-DNS-|-connect-|-TLS-|-------wait (TTFB)-------|==download==|

DNS       look up the server's IP address
connect   open the TCP connection
TLS       negotiate encryption (the https handshake)
wait      request sent; the server is thinking; no bytes back yet
download  the response body actually streaming in`, "anatomy of a waterfall row"),
      richP("Time to first byte — ", bold("TTFB"), " — is the boundary between wait and download: everything before it is networking plus server work, everything after is transfer. A long wait points at the backend (slow queries, cold starts, missing server-side caching); a long download points at size. Colors vary by tool, and every waterfall prints its legend — read segments and the legend rather than memorizing palettes."),
      h3("Shapes to look for in the full chart"),
      p("With the row grammar in place, whole charts read as shapes:"),
      ...bulletRich([
        [bold("A long wait on row one."), " Row one is the HTML document itself. If its TTFB is slow, every other row starts late, and no amount of frontend work can compensate — that is a backend or hosting conversation."],
        [bold("Staircases."), " Each step of a diagonal chain is a resource discovered only after the previous one arrived — CSS importing CSS, JavaScript fetching more JavaScript. Every step costs a round trip; flattening chains is among the highest-leverage fixes."],
        [bold("A crowd of rows before the green line."), " The vertical green line marks start render, the first moment anything appeared. Everything left of it is blank-screen time; a tall stack of scripts and stylesheets there is a render-blocking pile-up."],
        [bold("Fat downloads late in the chart."), " Usually oversized images: common, annoying, cheap to fix. Notice how different that diagnosis is from a slow row one — yet both arrive as the same complaint: 'the site is slow'."],
      ]),
      p("One more gift: WebPageTest loads the page twice and shows first view against repeat view. Repeat view should be dramatically lighter, because a returning visitor's cache serves most static files. If it re-downloads everything, your caching headers are misconfigured — a problem Lighthouse will never show you."),

      h2("Field data: what really happened to real users"),
      p("The field data you already have, without installing anything, comes from CrUX — the Chrome User Experience Report. Chrome users who opt into usage statistics anonymously report performance data; Google aggregates it per site over a rolling 28-day window and reports the 75th percentile. It is also the dataset behind Google Search's page-experience signal — the reason SEO tools keep bringing up Core Web Vitals."),
      p("Two free windows onto it:"),
      ...bulletRich([
        [bold("PageSpeed Insights"), " — the panel above the lab score shows real-user LCP, INP, and CLS: for the specific URL when it has enough traffic, otherwise for the whole origin. It is the first thing I check in any audit: it decides whether the lab work even matters."],
        [bold("Search Console, Core Web Vitals report"), " — the same data sliced into groups of similar URLs and tracked over time. It is where you learn that the article template, not the homepage, is failing INP on mobile — turning 'the site feels slow' into a ticket."],
      ]),
      p("The blind spots, honestly: CrUX is Chrome-only — Safari and iOS users are invisible, a real gap if your audience skews that way. Small sites simply show 'not enough data', which is normal, not an error. And the 28-day window means any fix takes weeks to fully surface in the numbers."),
      richP("The step beyond CrUX is collecting your own field data — ", bold("RUM"), ", real user monitoring: a small script reports each visitor's actual metrics back to you. The Chrome team's web-vitals library makes collection nearly trivial:"),
      code("ts", `import { onCLS, onINP, onLCP } from "web-vitals";

function send(metric: { name: string; value: number; id: string }) {
  const body = JSON.stringify(metric);

  // sendBeacon survives the tab closing; keepalive fetch is the fallback
  if (!navigator.sendBeacon("/api/vitals", body)) {
    fetch("/api/vitals", { method: "POST", body, keepalive: true });
  }
}

onCLS(send);
onINP(send);
onLCP(send);`, "app/report-web-vitals.ts"),
      p("Where you send it is up to you — a tiny API route writing rows to a table is a fine start, and then you can slice by device, country, or page in ways CrUX never will. One caveat: the browser APIs behind LCP, INP, and CLS are still largely Chromium-only, so RUM widens your view of users and pages more than of browser engines."),
      callout("info", "Deeper: RUM sampling. You do not need every visit. At any meaningful traffic level, sampling 10 percent of page views gives stable percentiles at a tenth of the ingestion cost. Two rules keep it honest: decide once per page view, not per metric event, so one visit's metrics stay together; and never store averages — keep raw values and read p75 and p95 from them, because averages hide exactly the slow tail Core Web Vitals exist to expose."),
      callout("info", "Deeper: SPAs and soft navigations. The metrics are defined against a real, hard page load. In a single-page app, client-side route changes — soft navigations — do not produce a new LCP or CLS, so your app's second and tenth screens are invisible to standard tooling. INP is the exception: it covers interactions across the page's whole lifetime, route changes included. Chrome has an experimental effort to give soft navigations their own metrics; as of mid-2026, assume your dashboards do not include it and time route changes yourself in your RUM code."),

      h2("The fifteen-minute habit"),
      richP("Everything above condenses into a ritual I run before and after any change that could plausibly affect performance. It lives next to the code, in a ", inlineCode("perf-journal.md"), " at the repo root, so numbers, dates, and commit hashes stay together:"),
      ...numbered([
        "Run PageSpeed Insights on the page you are about to touch. Record the field p75s (LCP, INP, CLS) and the lab metrics — not just the score — with the date and commit hash.",
        "Run Lighthouse locally three times: incognito, mobile preset. Write down the median LCP, TBT, and CLS.",
        "If the problem is load-shaped — slow LCP, long blank screen — run one WebPageTest and paste the result link into the journal.",
        "Make one change. Exactly one.",
        "Deploy, repeat steps one to three, and compare medians against the journal. Keep what survives; revert what does not.",
        "A month later, check Search Console's Core Web Vitals report — field data is the final grade, and it arrives on a delay.",
      ]),
      p("The discipline in step four is the whole method. Change two things at once and you no longer know which worked — or whether one helped, the other hurt, and they netted out. The journal is what turns performance from vibes into before-and-after pairs."),

      h2("Gotchas: how measurement itself misleads"),
      p("Score worship is the big one. The score is a lab artifact you can push around without users feeling a thing; it is worth chasing at 45, while past 90 the remaining points are often trivia even as field INP quietly fails. Optimize metrics people feel, and let the score follow."),
      p("Single-run comparisons are how you fool yourself politely. Run once before and once after, and the noise will hand you whichever conclusion you were hoping for. Medians of at least three runs, every time."),
      p("Measuring the vanity page is quieter. The homepage is what you demo, but Search Console will usually tell you the traffic and the failures live in a template — the article page, the product page. Measure where the users are, not where the pride is."),
      p("Dev-mode numbers are meaningless. Development servers skip minification, compression, and the framework's production optimizations — a Next.js app in dev mode is dramatically slower than its build. Only deployed, production-mode pages produce numbers worth writing down."),
      p("And the field-data lag will test your nerve. You ship a genuine fix and the PageSpeed Insights field panel stays red for weeks, because the 28-day window still contains the bad era. Do not revert a fix the lab confirms just because the field has not caught up — note the ship date and check back a month later."),

      h2("Where to go from here"),
      p("Measurement is half the loop, and deliberately the boring half — but from now on, every optimization you attempt has a before, an after, and a verdict. The next question is what to fix first, and now you get to answer it with evidence instead of instinct."),
      richP("For the fixing half, ", link("Web Performance Optimization: A Developer's Checklist", "/blog/web-performance-optimization-a-developer-s-checklist"), " is the companion piece — the highest-leverage changes in the order I apply them. And to understand what the browser is doing between those waterfall phases and the first paint, ", link("How the Browser Renders a Page: DOM, CSSOM, and the Critical Path", "/blog/how-the-browser-renders-a-page-dom-cssom-and-the-critical-path"), " walks the pipeline your metrics are sampling."),
    ],
  },
];

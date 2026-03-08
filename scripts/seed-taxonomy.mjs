/**
 * Seed script — creates categories and tags in Sanity.
 * Run: node scripts/seed-taxonomy.mjs
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[/]/g, "-")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const taxonomy = [
  {
    category: "Web Fundamentals",
    description: "Core building blocks of the web — HTML, CSS, JavaScript, TypeScript, and browser APIs.",
    tags: ["HTML", "CSS", "JavaScript", "TypeScript", "Web APIs"],
  },
  {
    category: "CSS Ecosystem",
    description: "CSS frameworks, preprocessors, animation libraries, and component styling tools.",
    tags: ["Bootstrap", "Tailwind CSS", "Sass / SCSS", "CSS Animations & Motion", "UI Component Libraries"],
  },
  {
    category: "JavaScript Frameworks",
    description: "Modern frontend and full-stack JavaScript frameworks for building web applications.",
    tags: ["React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte & SvelteKit", "Astro", "Remix", "Solid.js"],
  },
  {
    category: "Backend Technologies",
    description: "Server-side languages, frameworks, and runtime environments.",
    tags: ["Node.js", "Express.js", "NestJS", "Python (Django & FastAPI)", "PHP & Laravel", "Go (Golang)", ".NET & C#", "Ruby on Rails"],
  },
  {
    category: "Databases",
    description: "Relational and NoSQL databases, ORMs, and data layer technologies.",
    tags: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Prisma & ORMs", "SQLite"],
  },
  {
    category: "Cloud & Hosting",
    description: "Cloud platforms, hosting providers, and deployment infrastructure.",
    tags: ["AWS", "Google Cloud (GCP)", "Azure", "Vercel", "Netlify", "Cloudflare"],
  },
  {
    category: "Backend-as-a-Service",
    description: "Managed backend platforms that handle auth, databases, storage, and more.",
    tags: ["Supabase", "Firebase", "PocketBase", "Appwrite"],
  },
  {
    category: "APIs & Integrations",
    description: "API design patterns, communication protocols, payments, and authentication.",
    tags: ["REST API Design", "GraphQL", "tRPC", "WebSockets & Realtime", "Stripe & Payments", "Auth Systems"],
  },
  {
    category: "DevOps & Infrastructure",
    description: "Containerization, orchestration, CI/CD pipelines, and server management.",
    tags: ["Docker", "Kubernetes", "CI/CD", "Nginx & Apache", "Git & GitHub"],
  },
  {
    category: "Performance",
    description: "Web performance optimization, Core Web Vitals, and technical SEO.",
    tags: ["Web Performance & Core Web Vitals", "SEO & Technical SEO"],
  },
  {
    category: "Security",
    description: "Web application security best practices, vulnerabilities, and defenses.",
    tags: ["Web Security"],
  },
  {
    category: "AI & Machine Learning",
    description: "Artificial intelligence, LLM integrations, and AI-powered web development.",
    tags: ["AI in Web Development", "LLM API Integrations", "Vercel AI SDK & LangChain", "Generative UI"],
  },
  {
    category: "Mobile & Cross-Platform",
    description: "Building mobile apps and cross-platform experiences with web technologies.",
    tags: ["React Native", "Progressive Web Apps (PWA)", "Electron"],
  },
  {
    category: "Testing",
    description: "Unit testing, end-to-end testing, and test automation frameworks.",
    tags: ["Jest & Vitest", "Cypress & Playwright", "Testing Library"],
  },
  {
    category: "Build Tools & Tooling",
    description: "Bundlers, linters, formatters, and package managers for modern development workflows.",
    tags: ["Vite", "Webpack", "ESLint & Prettier", "npm / pnpm / yarn"],
  },
  {
    category: "Design & UI/UX",
    description: "Web design principles, design tools, design systems, and user experience.",
    tags: ["Web Design Principles", "Figma for Developers", "Design Systems", "Typography & Color", "Micro-interactions & UX"],
  },
  {
    category: "Specialized Topics",
    description: "Advanced and niche web development topics — WebAssembly, Web3, 3D, and more.",
    tags: ["Monorepo & Turborepo", "Micro-frontends", "WebAssembly (WASM)", "Web3 & Blockchain", "Three.js & WebGL", "Canvas & SVG", "Email Development", "Browser Extensions"],
  },
  {
    category: "Architecture & Patterns",
    description: "Software architecture, design patterns, state management, and serverless computing.",
    tags: ["Software Architecture", "Design Patterns in JS/TS", "State Management", "Serverless & Edge Computing"],
  },
  {
    category: "Developer Experience & Career",
    description: "Tools, workflows, career growth, and the developer lifestyle.",
    tags: ["VS Code Mastery", "Terminal & CLI Tools", "Documentation", "Open Source Contributing", "Freelancing & Agencies", "Remote Developer Life", "Job Hunting & Interviews", "Developer Roadmaps"],
  },
  {
    category: "Specialized Site Types",
    description: "Building specific types of websites — e-commerce, CMS-driven, landing pages, and accessible sites.",
    tags: ["E-commerce Development", "CMS & Headless CMS", "Landing Pages & Conversion", "Accessibility (a11y)"],
  },
];

async function seed() {
  console.log("Starting taxonomy seed...\n");

  // Check for existing categories/tags
  const existingCats = await client.fetch(`*[_type == "category"]{ title }`);
  const existingTags = await client.fetch(`*[_type == "tag"]{ title }`);
  const existingCatTitles = new Set(existingCats.map((c) => c.title));
  const existingTagTitles = new Set(existingTags.map((t) => t.title));

  let catCount = 0;
  let tagCount = 0;
  let skippedCats = 0;
  let skippedTags = 0;

  for (const group of taxonomy) {
    // Create category
    let categoryId;

    if (existingCatTitles.has(group.category)) {
      console.log(`  ⏭  Category already exists: "${group.category}"`);
      const existing = await client.fetch(
        `*[_type == "category" && title == $title][0]{ _id }`,
        { title: group.category }
      );
      categoryId = existing._id;
      skippedCats++;
    } else {
      const catDoc = await client.create({
        _type: "category",
        title: group.category,
        slug: { _type: "slug", current: slugify(group.category) },
        description: group.description,
      });
      categoryId = catDoc._id;
      catCount++;
      console.log(`  ✓  Category created: "${group.category}"`);
    }

    // Create tags
    for (const tagTitle of group.tags) {
      if (existingTagTitles.has(tagTitle)) {
        console.log(`     ⏭  Tag already exists: "${tagTitle}"`);
        skippedTags++;
        continue;
      }

      await client.create({
        _type: "tag",
        title: tagTitle,
        slug: { _type: "slug", current: slugify(tagTitle) },
        category: { _type: "reference", _ref: categoryId },
      });
      tagCount++;
      console.log(`     ✓  Tag created: "${tagTitle}"`);
    }

    console.log("");
  }

  console.log("─".repeat(50));
  console.log(`Done! Created ${catCount} categories and ${tagCount} tags.`);
  if (skippedCats || skippedTags) {
    console.log(`Skipped ${skippedCats} existing categories and ${skippedTags} existing tags.`);
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

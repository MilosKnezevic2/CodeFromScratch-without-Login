/**
 * Seed script — creates 10 full blog posts in Sanity with images and code blocks.
 * Run: node scripts/seed-posts.mjs
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const k = () => randomUUID().slice(0, 12);

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// --- Portable Text helpers ---
function p(text) {
  return { _type: "block", _key: k(), style: "normal", markDefs: [], children: [{ _type: "span", _key: k(), text, marks: [] }] };
}
function h2(text) {
  return { _type: "block", _key: k(), style: "h2", markDefs: [], children: [{ _type: "span", _key: k(), text, marks: [] }] };
}
function h3(text) {
  return { _type: "block", _key: k(), style: "h3", markDefs: [], children: [{ _type: "span", _key: k(), text, marks: [] }] };
}
function code(language, codeText, filename) {
  return { _type: "code", _key: k(), language, code: codeText, filename };
}
function callout(type, text) {
  return { _type: "callout", _key: k(), type, text };
}
function bold(text) {
  return { _type: "span", _key: k(), text, marks: ["strong"] };
}
function richP(...spans) {
  return { _type: "block", _key: k(), style: "normal", markDefs: [], children: spans.map(s => typeof s === "string" ? { _type: "span", _key: k(), text: s, marks: [] } : s) };
}
function bullet(items) {
  return items.map(text => ({
    _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1,
    markDefs: [], children: [{ _type: "span", _key: k(), text, marks: [] }],
  }));
}

// --- Upload image from URL ---
async function uploadImage(url, filename) {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buf, { filename });
  return asset._id;
}

// --- Post definitions ---
const posts = [
  {
    title: "Getting Started with Next.js 15: The Complete Guide",
    excerpt: "Everything you need to know about Next.js 15 — from app router to server components, streaming, and the new compiler.",
    categoryName: "JavaScript Frameworks",
    tagNames: ["Next.js", "React"],
    readingTime: 12,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1400&q=80",
    imageAlt: "Code on a laptop screen",
    content: [
      h2("Why Next.js 15?"),
      p("Next.js 15 represents a major leap forward for the React ecosystem. With the stable app router, React Server Components, and Turbopack as the default bundler, building modern web applications has never been more streamlined."),
      p("In this guide we will walk through the core features and build a small project from scratch to see everything in action."),
      callout("tip", "Make sure you have Node.js 18.17 or later installed before starting."),

      h2("Creating Your First Project"),
      p("Scaffolding a new project takes a single command:"),
      code("bash", `npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npm run dev`, "terminal"),
      p("This gives you a fully configured project with TypeScript, Tailwind CSS, and the app router out of the box."),

      h2("Understanding the App Router"),
      p("The app router uses a file-system based routing model inside the app/ directory. Every folder becomes a route segment, and special files like page.tsx, layout.tsx, and loading.tsx control rendering behavior."),
      h3("File Conventions"),
      ...bullet([
        "page.tsx — the UI for a route, makes the path publicly accessible",
        "layout.tsx — shared UI that wraps child routes, preserves state on navigation",
        "loading.tsx — instant loading UI with React Suspense",
        "error.tsx — error boundary that catches errors in child routes",
        "not-found.tsx — UI shown when notFound() is thrown",
      ]),
      code("tsx", `// app/blog/[slug]/page.tsx
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}`, "app/blog/[slug]/page.tsx"),

      h2("Server Components vs Client Components"),
      p("By default, every component in the app router is a React Server Component. They run only on the server, can directly access databases and APIs, and send zero JavaScript to the client."),
      p("When you need interactivity — event handlers, useState, useEffect — add the \"use client\" directive at the top of the file."),
      code("tsx", `"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}`, "components/Counter.tsx"),
      callout("info", "Keep client components small and push them to the leaves of your component tree. The more you keep on the server, the less JavaScript ships to the browser."),

      h2("Data Fetching"),
      p("Server components can use async/await directly — no useEffect, no loading states to manage manually. Next.js extends fetch() with automatic request deduplication and caching."),
      code("tsx", `async function getPost(slug: string) {
  const res = await fetch(
    \`https://api.example.com/posts/\${slug}\`,
    { next: { revalidate: 3600 } } // ISR: revalidate every hour
  );
  return res.json();
}`, "lib/api.ts"),

      h2("Wrapping Up"),
      p("Next.js 15 brings server-first rendering, streaming, and an incredible developer experience to production-ready React apps. Start building with the app router today and you will wonder how you ever lived without it."),
    ],
  },
  {
    title: "Mastering Tailwind CSS: From Basics to Advanced Patterns",
    excerpt: "A deep dive into Tailwind CSS — responsive design, custom themes, component patterns, and performance optimization.",
    categoryName: "CSS Ecosystem",
    tagNames: ["Tailwind CSS"],
    readingTime: 10,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1400&q=80",
    imageAlt: "Designer workspace with multiple screens",
    content: [
      h2("Why Tailwind CSS?"),
      p("Tailwind CSS is a utility-first CSS framework that lets you build custom designs without writing custom CSS. Instead of opinionated component styles, it provides low-level utility classes that you compose directly in your markup."),
      p("The result? Faster development, smaller bundles, and designs that are easy to change because styles live right next to the HTML they affect."),

      h2("Setting Up Tailwind"),
      code("bash", `npm install tailwindcss @tailwindcss/postcss postcss
npx tailwindcss init`, "terminal"),
      p("Then add Tailwind to your CSS entry point:"),
      code("css", `@import "tailwindcss";`, "app/globals.css"),

      h2("Responsive Design"),
      p("Tailwind uses mobile-first breakpoints with intuitive prefixes. Every utility can be prefixed with sm:, md:, lg:, xl:, or 2xl: to apply at different screen sizes."),
      code("html", `<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  <div class="rounded-xl bg-white p-6 shadow-md">
    <h3 class="text-lg font-semibold">Card Title</h3>
    <p class="mt-2 text-gray-600">Card content goes here.</p>
  </div>
</div>`, "responsive-grid.html"),

      h2("Custom Theme Configuration"),
      p("Extend or override the default theme in tailwind.config.js to match your brand:"),
      code("js", `/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          500: "#0ea5e9",
          900: "#0c4a6e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
};`, "tailwind.config.js"),

      h2("Component Patterns with @apply"),
      p("For repeated patterns, extract utility combinations using @apply in your CSS:"),
      code("css", `.btn-primary {
  @apply rounded-lg bg-brand-500 px-4 py-2 font-medium text-white
         transition hover:bg-brand-600 focus:outline-none
         focus:ring-2 focus:ring-brand-500 focus:ring-offset-2;
}`, "styles.css"),
      callout("warning", "Use @apply sparingly. Overusing it defeats the purpose of utility-first CSS. Reserve it for truly repeated patterns like buttons and form inputs."),

      h2("Dark Mode"),
      p("Tailwind supports dark mode out of the box with the dark: variant. Use the class strategy to toggle it with JavaScript:"),
      code("html", `<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <h1 class="text-2xl font-bold">Adapts to theme</h1>
</div>`, "dark-mode.html"),

      h2("Performance Tips"),
      ...bullet([
        "Tailwind v4 automatically tree-shakes unused styles — no configuration needed",
        "Use arbitrary values sparingly: w-[327px] creates one-off classes",
        "Group related utilities with component extraction, not @apply",
        "Use the typography plugin for rich text content",
      ]),
      p("Tailwind CSS makes it possible to build beautiful, responsive interfaces without ever leaving your HTML. Once you get the hang of the utility-first workflow, going back feels impossible."),
    ],
  },
  {
    title: "Building REST APIs with Node.js and Express",
    excerpt: "Learn how to design and build production-ready REST APIs using Node.js, Express, and best practices for error handling and validation.",
    categoryName: "Backend Technologies",
    tagNames: ["Node.js", "Express.js"],
    readingTime: 14,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&q=80",
    imageAlt: "Server room with blue lights",
    content: [
      h2("Project Setup"),
      p("Let us start by scaffolding a clean Express project with TypeScript:"),
      code("bash", `mkdir my-api && cd my-api
npm init -y
npm install express cors helmet
npm install -D typescript @types/express @types/node tsx
npx tsc --init`, "terminal"),

      h2("Basic Server"),
      code("ts", `import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`, "src/server.ts"),

      h2("RESTful Route Design"),
      p("Follow REST conventions for predictable, self-documenting APIs:"),
      ...bullet([
        "GET /api/posts — list all posts (with pagination)",
        "GET /api/posts/:id — get a single post",
        "POST /api/posts — create a new post",
        "PUT /api/posts/:id — update a post",
        "DELETE /api/posts/:id — delete a post",
      ]),

      h3("Router Module"),
      code("ts", `import { Router } from "express";

const router = Router();

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

const posts: Post[] = [];

router.get("/", (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const start = (page - 1) * limit;

  res.json({
    data: posts.slice(start, start + limit),
    total: posts.length,
    page,
    pages: Math.ceil(posts.length / limit),
  });
});

router.post("/", (req, res) => {
  const { title, content } = req.body;
  const post: Post = {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: new Date(),
  };
  posts.push(post);
  res.status(201).json(post);
});

export default router;`, "src/routes/posts.ts"),

      h2("Error Handling Middleware"),
      p("Centralized error handling keeps your route handlers clean:"),
      code("ts", `class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

function errorHandler(err: Error, req: any, res: any, next: any) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

export { AppError, errorHandler };`, "src/middleware/error.ts"),
      callout("tip", "Always validate request bodies at the boundary. Libraries like Zod or Joi make schema validation effortless."),

      h2("Input Validation with Zod"),
      code("ts", `import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

router.post("/", (req, res, next) => {
  const result = createPostSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  // result.data is now typed and validated
  const post = createPost(result.data);
  res.status(201).json(post);
});`, "src/routes/posts.ts"),

      h2("Conclusion"),
      p("A well-structured Express API with proper error handling, validation, and RESTful conventions is the backbone of any web application. From here you can add a database layer, authentication, rate limiting, and deploy to any Node.js hosting platform."),
    ],
  },
  {
    title: "PostgreSQL for Web Developers: A Practical Guide",
    excerpt: "Master PostgreSQL from schema design to advanced queries — everything a web developer needs to know for building data-driven applications.",
    categoryName: "Databases",
    tagNames: ["PostgreSQL", "Prisma & ORMs"],
    readingTime: 11,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1400&q=80",
    imageAlt: "Database visualization with connected nodes",
    content: [
      h2("Why PostgreSQL?"),
      p("PostgreSQL is the world's most advanced open-source relational database. It handles everything from simple CRUD apps to complex analytics workloads, with features like JSON support, full-text search, and row-level security built in."),

      h2("Schema Design Basics"),
      p("Good schema design starts with understanding your data relationships. Here is a typical blog schema:"),
      code("sql", `CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  content     TEXT,
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tags (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- Many-to-many junction table
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);`, "schema.sql"),

      h2("Essential Queries"),
      h3("Joins and Aggregation"),
      code("sql", `-- Get posts with author name and tag count
SELECT
  p.title,
  u.name AS author,
  COUNT(pt.tag_id) AS tag_count
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN post_tags pt ON pt.post_id = p.id
WHERE p.status = 'published'
GROUP BY p.id, u.name
ORDER BY p.published_at DESC
LIMIT 10;`, "queries.sql"),

      h3("JSON Aggregation"),
      p("PostgreSQL can return related data as JSON arrays — perfect for APIs:"),
      code("sql", `SELECT
  p.*,
  json_agg(json_build_object('id', t.id, 'name', t.name)) AS tags
FROM posts p
LEFT JOIN post_tags pt ON pt.post_id = p.id
LEFT JOIN tags t ON t.id = pt.tag_id
WHERE p.id = $1
GROUP BY p.id;`, "post-with-tags.sql"),
      callout("info", "Use jsonb_agg and jsonb_build_object for the binary JSON type, which is faster for queries and supports indexing."),

      h2("Indexing for Performance"),
      p("Indexes are crucial for query performance. Add them on columns you frequently filter, sort, or join on:"),
      code("sql", `-- Speeds up lookups by slug
CREATE INDEX idx_posts_slug ON posts(slug);

-- Speeds up filtering by status + ordering by date
CREATE INDEX idx_posts_status_date ON posts(status, published_at DESC);

-- GIN index for full-text search
ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED;

CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);`, "indexes.sql"),

      h2("Using with Prisma"),
      p("Prisma is the most popular ORM for Node.js and works beautifully with PostgreSQL:"),
      code("ts", `const posts = await prisma.post.findMany({
  where: { status: "published" },
  include: {
    author: { select: { name: true, email: true } },
    tags: { include: { tag: true } },
  },
  orderBy: { publishedAt: "desc" },
  take: 10,
});`, "lib/queries.ts"),

      h2("Conclusion"),
      p("PostgreSQL gives you enterprise-grade reliability with modern features like JSON, full-text search, and advanced indexing. Combined with an ORM like Prisma, it provides the perfect data layer for any web application."),
    ],
  },
  {
    title: "Authentication in Next.js with NextAuth.js v5",
    excerpt: "Implement secure authentication in your Next.js app using NextAuth.js v5 with OAuth providers, credentials, and JWT sessions.",
    categoryName: "APIs & Integrations",
    tagNames: ["Auth Systems", "React", "Next.js"],
    readingTime: 13,
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1400&q=80",
    imageAlt: "Security lock on a digital background",
    content: [
      h2("What is NextAuth.js v5?"),
      p("NextAuth.js v5 (also called Auth.js) is the standard authentication library for Next.js applications. It supports OAuth providers like Google and GitHub, email/password credentials, magic links, and more — all with a simple, secure API."),

      h2("Installation"),
      code("bash", `npm install next-auth@5 @auth/prisma-adapter @prisma/client
npx prisma init`, "terminal"),

      h2("Configuration"),
      p("Create the auth configuration file:"),
      code("ts", `// lib/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        return valid ? user : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});`, "lib/auth.ts"),

      h2("Route Handler"),
      code("ts", `// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;`, "app/api/auth/[...nextauth]/route.ts"),

      h2("Protecting Routes"),
      h3("Server Components"),
      code("ts", `import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <h1>Welcome, {session.user.name}</h1>;
}`, "app/dashboard/page.tsx"),

      h3("Client Components"),
      code("tsx", `"use client";
import { useSession } from "next-auth/react";

export default function ProfileButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <Skeleton />;
  if (!session) return <LoginButton />;

  return (
    <div>
      <img src={session.user.image} alt="" />
      <span>{session.user.name}</span>
    </div>
  );
}`, "components/ProfileButton.tsx"),

      h3("API Routes"),
      code("ts", `import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Protected logic here...
}`, "app/api/protected/route.ts"),
      callout("warning", "Never trust the client session for authorization. Always verify the session server-side in API routes and server components."),

      h2("Conclusion"),
      p("NextAuth.js v5 makes authentication in Next.js straightforward and secure. With JWT sessions, multiple providers, and the Prisma adapter, you can have a full auth system running in under an hour."),
    ],
  },
  {
    title: "Docker for Frontend Developers: A Practical Introduction",
    excerpt: "Learn Docker from scratch — containers, images, Docker Compose, and how to containerize your web applications for consistent deployments.",
    categoryName: "DevOps & Infrastructure",
    tagNames: ["Docker"],
    readingTime: 9,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=1400&q=80",
    imageAlt: "Shipping containers at a port",
    content: [
      h2("Why Docker?"),
      p("\"It works on my machine\" is the most dreaded phrase in software development. Docker eliminates this problem by packaging your application with all its dependencies into a portable container that runs identically everywhere."),
      ...bullet([
        "Consistent environments across development, staging, and production",
        "Easy onboarding — new developers run one command to get started",
        "Microservices architecture — each service in its own container",
        "CI/CD integration — build and test in containers",
      ]),

      h2("Core Concepts"),
      p("Docker has three fundamental concepts: images, containers, and volumes. An image is a blueprint, a container is a running instance of an image, and a volume is persistent storage."),

      h2("Your First Dockerfile"),
      p("Here is a production-ready Dockerfile for a Next.js application using multi-stage builds:"),
      code("bash", `# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]`, "Dockerfile"),
      callout("tip", "Multi-stage builds dramatically reduce your final image size. The production image only contains what is needed to run the app."),

      h2("Docker Compose for Full-Stack"),
      p("Docker Compose lets you define multi-container applications in a single YAML file:"),
      code("yaml", `services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:secret@db:5432/myapp
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:`, "docker-compose.yml"),

      h2("Essential Commands"),
      code("bash", `# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f app

# Stop everything
docker compose down

# Shell into a running container
docker exec -it my-app-1 sh

# Prune unused images and volumes
docker system prune -a`, "terminal"),

      h2("Conclusion"),
      p("Docker turns deployment from a headache into a repeatable process. Start with a simple Dockerfile for your project, add Docker Compose when you need a database or other services, and you will have a professional deployment workflow."),
    ],
  },
  {
    title: "TypeScript Generics Explained with Real-World Examples",
    excerpt: "Understand TypeScript generics through practical examples — from simple functions to advanced patterns used in production codebases.",
    categoryName: "Web Fundamentals",
    tagNames: ["TypeScript"],
    readingTime: 10,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1400&q=80",
    imageAlt: "Abstract geometric patterns",
    content: [
      h2("What Are Generics?"),
      p("Generics let you write functions, classes, and types that work with any data type while preserving type safety. Think of them as type-level parameters — placeholders that get filled in when you use the code."),
      p("Without generics, you would have to write separate functions for each type or use 'any' and lose type safety. Generics give you the best of both worlds."),

      h2("Your First Generic Function"),
      code("ts", `// Without generics — loses type info
function first(arr: any[]): any {
  return arr[0];
}

// With generics — preserves type info
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const num = first([1, 2, 3]);       // type: number
const str = first(["a", "b", "c"]); // type: string`, "generics-intro.ts"),

      h2("Constraining Generics"),
      p("Use the extends keyword to limit what types a generic can accept:"),
      code("ts", `interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Works with any object that has an id
const user = findById(users, "abc-123");   // type: User
const post = findById(posts, "xyz-789");   // type: Post

// Error: number[] doesn't have 'id' property
findById([1, 2, 3], "1");`, "constraints.ts"),

      h2("Generic Interfaces and Types"),
      code("ts", `// API response wrapper
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Paginated response
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

// Usage
type UserResponse = ApiResponse<User>;
type PostListResponse = PaginatedResponse<Post>;

async function fetchPosts(): Promise<PaginatedResponse<Post>> {
  const res = await fetch("/api/posts");
  return res.json();
}`, "generic-interfaces.ts"),

      h2("Utility Type Patterns"),
      p("TypeScript's built-in utility types are all implemented with generics:"),
      code("ts", `// Make all properties optional
type PartialUser = Partial<User>;

// Pick specific properties
type UserPreview = Pick<User, "id" | "name" | "avatar">;

// Omit properties
type CreateUserInput = Omit<User, "id" | "createdAt">;

// Build your own utility types
type Nullable<T> = { [K in keyof T]: T[K] | null };
type ReadonlyDeep<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? ReadonlyDeep<T[K]>
    : T[K];
};`, "utility-types.ts"),
      callout("info", "Master Partial, Pick, Omit, and Record — they cover 90% of real-world type transformation needs."),

      h2("Real-World: Generic React Hook"),
      code("tsx", `function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then((json: T) => setData(json))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, error, loading };
}

// Fully typed!
const { data: posts } = useFetch<Post[]>("/api/posts");
const { data: user } = useFetch<User>("/api/user/me");`, "hooks/useFetch.ts"),

      h2("Conclusion"),
      p("Generics are the key to writing reusable, type-safe TypeScript code. Start with simple generic functions, then work up to constrained generics and utility types. The patterns you learn will show up everywhere — in React components, API clients, state management, and more."),
    ],
  },
  {
    title: "Web Performance Optimization: A Developer's Checklist",
    excerpt: "Improve your Core Web Vitals and page speed scores with this comprehensive checklist covering images, fonts, JavaScript, and server-side optimizations.",
    categoryName: "Performance",
    tagNames: ["Web Performance & Core Web Vitals", "SEO & Technical SEO"],
    readingTime: 8,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80",
    imageAlt: "Dashboard with performance metrics",
    content: [
      h2("Core Web Vitals"),
      p("Google measures three key metrics that directly impact your search rankings:"),
      ...bullet([
        "LCP (Largest Contentful Paint) — how fast the main content loads. Target: under 2.5 seconds.",
        "INP (Interaction to Next Paint) — how responsive the page feels. Target: under 200ms.",
        "CLS (Cumulative Layout Shift) — how much the layout jumps around. Target: under 0.1.",
      ]),

      h2("Image Optimization"),
      p("Images are usually the biggest performance bottleneck. Here is how to fix them:"),
      code("html", `<!-- Use modern formats with fallbacks -->
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img
    src="hero.jpg"
    alt="Hero image"
    width="1200"
    height="630"
    loading="lazy"
    decoding="async"
  />
</picture>`, "optimized-image.html"),
      callout("tip", "Always set explicit width and height attributes on images to prevent layout shift (CLS)."),

      h3("Next.js Image Component"),
      code("tsx", `import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={630}
  priority  // Load immediately for above-the-fold images
  sizes="(max-width: 768px) 100vw, 50vw"
/>`, "next-image.tsx"),

      h2("Font Loading Strategy"),
      code("css", `/* Preload critical fonts */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-var.woff2") format("woff2");
  font-display: swap;  /* Show fallback font immediately */
  font-weight: 100 900;
}`, "fonts.css"),
      ...bullet([
        "Use font-display: swap to avoid invisible text during loading",
        "Self-host fonts instead of using Google Fonts CDN",
        "Use variable fonts to reduce the number of font files",
        "Subset fonts to include only the characters you need",
      ]),

      h2("JavaScript Optimization"),
      ...bullet([
        "Code-split with dynamic imports: const Modal = dynamic(() => import('./Modal'))",
        "Defer third-party scripts: <script defer src='analytics.js'>",
        "Tree-shake unused code — use named exports over default exports",
        "Avoid layout thrashing — batch DOM reads and writes",
      ]),

      h2("Server-Side Optimizations"),
      code("ts", `// next.config.js — enable compression and caching
const config = {
  compress: true,
  headers: async () => [
    {
      source: "/:all*(svg|jpg|png|webp|avif)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};`, "next.config.ts"),

      h2("Measuring Performance"),
      p("Use these tools regularly to catch regressions:"),
      ...bullet([
        "Lighthouse — built into Chrome DevTools, gives actionable suggestions",
        "WebPageTest — detailed waterfall charts and filmstrips",
        "Chrome DevTools Performance panel — CPU profiling and flame charts",
        "Vercel Analytics — real user monitoring with Core Web Vitals",
      ]),
      p("Performance is not a one-time fix — it is a continuous practice. Add Lighthouse CI to your deployment pipeline and set performance budgets to prevent regressions."),
    ],
  },
  {
    title: "Git Workflow Strategies for Development Teams",
    excerpt: "Compare Git branching strategies — trunk-based development, GitHub Flow, and GitFlow — and learn which one fits your team best.",
    categoryName: "DevOps & Infrastructure",
    tagNames: ["Git & GitHub"],
    readingTime: 7,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1400&q=80",
    imageAlt: "Branching tree pattern",
    content: [
      h2("Why Git Strategy Matters"),
      p("A good Git workflow reduces merge conflicts, speeds up code reviews, and makes deployments predictable. The wrong strategy creates bottlenecks and frustration."),
      p("Let us compare the three most popular approaches and when to use each."),

      h2("Trunk-Based Development"),
      p("Everyone commits to the main branch. Feature flags control what is visible to users."),
      ...bullet([
        "Best for: small teams, continuous deployment, experienced developers",
        "Pros: simple, fast, no long-lived branches to manage",
        "Cons: requires strong CI/CD, feature flags add complexity",
      ]),
      code("bash", `# Typical trunk-based workflow
git checkout main
git pull
# Make small, focused changes
git add -A
git commit -m "feat: add user avatar upload"
git push origin main  # CI runs, auto-deploys`, "trunk-based.sh"),

      h2("GitHub Flow"),
      p("Create a branch for each feature, open a pull request, get it reviewed, merge to main."),
      ...bullet([
        "Best for: most teams, open source projects, teams that use code review",
        "Pros: great balance of simplicity and safety, supports async code review",
        "Cons: branches can get stale if PRs sit too long",
      ]),
      code("bash", `# GitHub Flow workflow
git checkout -b feat/user-profile
# ... make changes ...
git add -A
git commit -m "feat: add user profile page"
git push -u origin feat/user-profile

# Open PR on GitHub, get review, merge
# Delete branch after merge`, "github-flow.sh"),
      callout("tip", "Keep PRs small (under 400 lines of code). Large PRs get rubber-stamped, small PRs get real reviews."),

      h2("GitFlow"),
      p("A structured model with main, develop, feature, release, and hotfix branches."),
      ...bullet([
        "Best for: projects with scheduled releases, mobile apps, enterprise software",
        "Pros: clear release process, supports parallel development and hotfixes",
        "Cons: complex, lots of merge ceremony, slower than other workflows",
      ]),
      code("bash", `# GitFlow branches
main          # Production-ready code
develop       # Integration branch
feature/*     # New features (branch from develop)
release/*     # Release preparation (branch from develop)
hotfix/*      # Emergency fixes (branch from main)`, "gitflow.sh"),

      h2("Commit Message Conventions"),
      p("Use Conventional Commits for consistent, parseable history:"),
      code("bash", `# Format: type(scope): description
feat(auth): add Google OAuth login
fix(api): handle null response from payment gateway
docs(readme): update deployment instructions
refactor(db): extract query builder utility
chore(deps): bump next from 14.2 to 15.0`, "commits.sh"),

      h2("Which Strategy Should You Choose?"),
      ...bullet([
        "Solo developer or tiny team → trunk-based development",
        "Most web teams → GitHub Flow with required reviews",
        "Scheduled releases or app stores → GitFlow",
        "Open source → GitHub Flow with a CONTRIBUTING.md guide",
      ]),
      p("The best Git workflow is the one your team actually follows consistently. Start simple and add structure only when you feel the pain of not having it."),
    ],
  },
  {
    title: "Building Real-Time Features with WebSockets and Next.js",
    excerpt: "Add live updates to your Next.js app using WebSockets — from chat messages to collaborative editing and live notifications.",
    categoryName: "APIs & Integrations",
    tagNames: ["WebSockets & Realtime", "Next.js", "React"],
    readingTime: 11,
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80",
    imageAlt: "Real-time data visualization dashboard",
    content: [
      h2("When Do You Need WebSockets?"),
      p("HTTP is request-response: the client asks, the server answers. WebSockets open a persistent two-way connection where both sides can send messages at any time."),
      p("Use WebSockets when you need:"),
      ...bullet([
        "Chat and messaging features",
        "Live notifications and activity feeds",
        "Collaborative editing (like Google Docs)",
        "Real-time dashboards and monitoring",
        "Multiplayer games or interactive experiences",
      ]),
      callout("info", "If you only need server-to-client updates (no client-to-server messages), consider Server-Sent Events (SSE) instead — they are simpler and work over regular HTTP."),

      h2("WebSocket Server with ws"),
      p("We will use the ws library to create a WebSocket server alongside our Next.js app:"),
      code("bash", `npm install ws
npm install -D @types/ws`, "terminal"),
      code("ts", `// server/ws.ts
import { WebSocketServer, WebSocket } from "ws";

interface Client {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
}

const clients = new Map<string, Client>();

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const userId = new URL(req.url!, "http://localhost")
      .searchParams.get("userId");

    if (!userId) {
      ws.close(1008, "User ID required");
      return;
    }

    const client: Client = { ws, userId, rooms: new Set() };
    clients.set(userId, client);

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      handleMessage(client, msg);
    });

    ws.on("close", () => {
      clients.delete(userId);
    });
  });
}

function handleMessage(client: Client, msg: any) {
  switch (msg.type) {
    case "join-room":
      client.rooms.add(msg.roomId);
      break;

    case "chat-message":
      broadcast(msg.roomId, {
        type: "chat-message",
        userId: client.userId,
        text: msg.text,
        timestamp: Date.now(),
      });
      break;
  }
}

function broadcast(roomId: string, data: any) {
  const payload = JSON.stringify(data);
  for (const client of clients.values()) {
    if (client.rooms.has(roomId) &&
        client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}`, "server/ws.ts"),

      h2("React Hook for WebSocket"),
      code("tsx", `"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3 seconds
      setTimeout(() => {
        wsRef.current = new WebSocket(url);
      }, 3000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };

    return () => ws.close();
  }, [url]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, messages, send };
}`, "hooks/useWebSocket.ts"),

      h2("Chat Component"),
      code("tsx", `"use client";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState } from "react";

export default function Chat({ roomId }: { roomId: string }) {
  const { connected, messages, send } = useWebSocket(
    \`ws://localhost:3001/ws?userId=\${userId}\`
  );
  const [text, setText] = useState("");

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    send({ type: "chat-message", roomId, text });
    setText("");
  }

  return (
    <div className="flex h-[500px] flex-col rounded-xl border">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className={\`h-2 w-2 rounded-full \${
          connected ? "bg-green-500" : "bg-red-500"
        }\`} />
        <span className="text-sm">
          {connected ? "Connected" : "Reconnecting..."}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="rounded-lg bg-muted p-3">
            <p className="text-sm">{msg.text}</p>
            <span className="text-xs text-muted-foreground">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex border-t p-3 gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
          Send
        </button>
      </form>
    </div>
  );
}`, "components/Chat.tsx"),
      callout("warning", "In production, use a managed WebSocket service like Pusher, Ably, or Supabase Realtime instead of self-hosting. They handle scaling, reconnection, and presence out of the box."),

      h2("Conclusion"),
      p("WebSockets unlock a world of interactive features that HTTP alone cannot provide. Start with a simple chat or notification system, and once you are comfortable with the pattern, expand to collaborative features and real-time dashboards."),
    ],
  },
];

// --- Main seed function ---
async function seed() {
  console.log("Seeding 10 blog posts...\n");

  // Fetch existing data
  const [authors, categories, tags, existingPosts] = await Promise.all([
    client.fetch(`*[_type == "author"]{ _id, name }`),
    client.fetch(`*[_type == "category"]{ _id, title }`),
    client.fetch(`*[_type == "tag"]{ _id, title }`),
    client.fetch(`*[_type == "post"]{ slug }`),
  ]);

  const existingSlugs = new Set(existingPosts.map((p) => p.slug?.current));

  // Ensure we have an author
  let author = authors[0];
  if (!author) {
    console.log("  No author found. Creating default author...");
    author = await client.create({
      _type: "author",
      name: "CodeFromScratch",
      slug: { _type: "slug", current: "codefromscratch" },
      bio: "Web development tutorials, guides, and deep dives.",
    });
    console.log(`  ✓ Author created: "${author.name}"\n`);
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.title, c._id]));
  const tagMap = Object.fromEntries(tags.map((t) => [t.title, t._id]));

  let created = 0;
  let skipped = 0;

  for (const post of posts) {
    const slug = slugify(post.title);

    if (existingSlugs.has(slug)) {
      console.log(`  ⏭  Already exists: "${post.title}"`);
      skipped++;
      continue;
    }

    // Upload featured image
    console.log(`  📷 Uploading image for: "${post.title}"...`);
    let imageAssetId;
    try {
      imageAssetId = await uploadImage(post.imageUrl, `${slug}.jpg`);
    } catch (err) {
      console.log(`  ⚠  Image upload failed, skipping image: ${err.message}`);
    }

    // Resolve category reference
    const categoryId = catMap[post.categoryName];
    if (!categoryId) {
      console.log(`  ⚠  Category not found: "${post.categoryName}", skipping post.`);
      continue;
    }

    // Resolve tag references
    const tagRefs = post.tagNames
      .map((name) => tagMap[name])
      .filter(Boolean)
      .map((id) => ({ _type: "reference", _ref: id, _key: k() }));

    // Build published date — stagger over past 30 days
    const daysAgo = (posts.length - posts.indexOf(post)) * 3;
    const publishedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

    const doc = {
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: slug },
      status: "published",
      isPremium: post.isPremium,
      publishedAt,
      readingTime: post.readingTime,
      excerpt: post.excerpt,
      seoTitle: `${post.title} | CodeFromScratch`,
      seoDescription: post.excerpt,
      author: { _type: "reference", _ref: author._id },
      categories: [{ _type: "reference", _ref: categoryId, _key: k() }],
      tags: tagRefs,
      content: post.content,
    };

    if (imageAssetId) {
      doc.featuredImage = {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
        alt: post.imageAlt,
      };
    }

    await client.create(doc);
    created++;
    console.log(`  ✓  Created: "${post.title}"`);
  }

  console.log("\n" + "─".repeat(50));
  console.log(`Done! Created ${created} posts, skipped ${skipped}.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

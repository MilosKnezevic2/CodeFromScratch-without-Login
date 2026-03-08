/**
 * Seed script — creates 10 more blog posts (batch 2) in Sanity.
 * Run: node scripts/seed-posts-batch2.mjs
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
  // ─── POST 1 ───────────────────────────────────────────────
  {
    title: "React State Management in 2025: Zustand vs Redux vs Context",
    excerpt: "A hands-on comparison of the most popular React state management solutions with real-world examples and performance benchmarks.",
    categoryName: "JavaScript Frameworks",
    tagNames: ["React"],
    readingTime: 11,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1400&q=80",
    imageAlt: "React logo on a dark background",
    content: [
      h2("The State of State Management"),
      p("State management has always been one of the most debated topics in the React ecosystem. From the early days of Redux boilerplate to the modern simplicity of Zustand, the landscape has shifted dramatically. In 2025, developers have more options than ever, but that abundance of choice can be paralyzing."),
      p("In this article, we will compare three of the most popular approaches: React Context API, Redux Toolkit, and Zustand. We will build the same feature — a shopping cart — with each solution so you can see the trade-offs firsthand."),
      callout("info", "This comparison focuses on client-side state. For server state (API data), use TanStack Query or SWR instead — they solve a fundamentally different problem."),

      h2("React Context API"),
      p("The Context API is built into React and requires no additional dependencies. It is ideal for simple, low-frequency state like themes, locale preferences, or authentication status."),
      h3("Setting Up a Cart Context"),
      code("tsx", `import { createContext, useContext, useState, ReactNode } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};`, "CartContext.tsx"),
      callout("warning", "Context triggers a re-render for every component that consumes it when any part of the value changes. For a large cart with frequent updates, this can cause performance issues."),

      h2("Redux Toolkit"),
      p("Redux Toolkit (RTK) is the official, opinionated way to write Redux logic. It eliminates the boilerplate that made Redux infamous while keeping the powerful middleware ecosystem and DevTools integration."),
      h3("Creating a Cart Slice"),
      code("typescript", `import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const cartSlice = createSlice({
  name: "cart",
  initialState: [] as CartItem[],
  reducers: {
    addItem(state, action: PayloadAction<Omit<CartItem, "quantity">>) {
      const existing = state.find((i) => i.id === action.payload.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.push({ ...action.payload, quantity: 1 });
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      return state.filter((i) => i.id !== action.payload);
    },
  },
});

export const { addItem, removeItem } = cartSlice.actions;
export default cartSlice.reducer;`, "cartSlice.ts"),
      p("RTK uses Immer under the hood, so you can write mutative code that gets translated into immutable updates. Notice how we directly push to the array and mutate existing.quantity — Immer handles the rest."),

      h2("Zustand"),
      p("Zustand is a minimal state management library that has taken the React community by storm. It requires no providers, no boilerplate, and works outside of React components too."),
      h3("Creating a Cart Store"),
      code("typescript", `import { create } from "zustand";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  total: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));`, "cartStore.ts"),
      p("With Zustand, components only re-render when the specific slice of state they subscribe to changes. This gives you fine-grained reactivity without any extra work."),

      h2("Performance Comparison"),
      p("We benchmarked each solution with a cart containing 100 items and rapid add/remove operations:"),
      ...bullet([
        "Context API: ~45ms per batch update — every consumer re-renders on every change",
        "Redux Toolkit: ~12ms per batch update — selector-based subscriptions prevent unnecessary renders",
        "Zustand: ~8ms per batch update — smallest bundle size, automatic shallow comparison",
      ]),

      h2("When to Use What"),
      ...bullet([
        "Context API — small apps, rarely changing global state like themes or auth",
        "Redux Toolkit — large applications with complex state logic, middleware needs, or team familiarity with Redux",
        "Zustand — most new projects, simple to complex state, best developer experience and performance",
      ]),

      h2("Key Takeaways"),
      p("There is no single best solution — each tool has its strengths. However, for most new React projects in 2025, Zustand provides the best balance of simplicity, performance, and flexibility. Start with Zustand, and reach for Redux Toolkit when you need its middleware ecosystem or when your team is already invested in the Redux pattern."),
      callout("tip", "Regardless of which library you choose, always keep server state separate using TanStack Query or SWR. Mixing server cache with UI state is the number one mistake in React state management."),
    ],
  },

  // ─── POST 2 ───────────────────────────────────────────────
  {
    title: "CSS Grid Layout: The Complete Visual Guide",
    excerpt: "Learn CSS Grid from scratch with visual examples, practical layouts, and the patterns you will use every day as a frontend developer.",
    categoryName: "Web Fundamentals",
    tagNames: ["CSS"],
    readingTime: 13,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=80",
    imageAlt: "Grid pattern on an architectural structure",
    content: [
      h2("Why CSS Grid Changes Everything"),
      p("Before CSS Grid, creating two-dimensional layouts required hacks — floats, inline-block tricks, and eventually Flexbox workarounds. CSS Grid was designed from the ground up for layout, and it fundamentally changes how we think about page structure."),
      p("Unlike Flexbox which is one-dimensional (row or column), Grid works in both dimensions simultaneously. You define rows and columns, then place items anywhere on that grid. This makes complex layouts trivial and your CSS dramatically shorter."),
      callout("info", "CSS Grid and Flexbox are complementary, not competing. Use Grid for page-level layout and Flexbox for component-level alignment within grid items."),

      h2("Your First Grid"),
      p("Creating a grid container is as simple as setting display: grid on a parent element. From there, you define the column and row structure."),
      code("css", `.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

/* This creates a 3-column layout where each column
   takes up an equal fraction of the available space.
   The gap property adds consistent spacing between items. */`, "basic-grid.css"),
      code("html", `<div class="container">
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
  <div class="item">4</div>
  <div class="item">5</div>
  <div class="item">6</div>
</div>

<!-- Items automatically flow into the grid,
     filling each row before moving to the next -->`, "index.html"),

      h2("The fr Unit"),
      p("The fr unit is Grid's most powerful feature. It represents a fraction of the available space in the grid container. Unlike percentages, fr units automatically account for gaps and fixed-size tracks."),
      code("css", `/* Sidebar layout: fixed sidebar, flexible main content */
.layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
  min-height: 100vh;
}

/* Three columns where the middle is twice as wide */
.three-col {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
}`, "fr-units.css"),

      h2("Grid Template Areas"),
      p("Grid template areas let you name regions of your layout and place items by name. This is the most readable way to define complex page layouts."),
      code("css", `.page {
  display: grid;
  grid-template-areas:
    "header  header  header"
    "sidebar content aside"
    "footer  footer  footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  gap: 1rem;
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.aside   { grid-area: aside; }
.footer  { grid-area: footer; }`, "template-areas.css"),
      callout("tip", "Grid template areas give you a visual ASCII-art representation of your layout right in the CSS. When you come back to this code in six months, you will immediately understand the structure."),

      h2("Responsive Grid with auto-fill and minmax"),
      p("One of the most powerful patterns in CSS Grid is creating responsive layouts without any media queries. The auto-fill keyword combined with minmax() does this elegantly."),
      code("css", `/* Cards that auto-wrap: min 280px, max 1fr */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* This single line handles:
   - 4 columns on wide screens
   - 3 columns on medium screens
   - 2 columns on small screens
   - 1 column on mobile
   All without a single media query! */`, "responsive-grid.css"),
      p("The difference between auto-fill and auto-fit is subtle but important. auto-fill creates as many tracks as possible, even if some are empty. auto-fit collapses empty tracks so existing items stretch to fill the space."),

      h2("Placing Items on the Grid"),
      p("You can explicitly place items using line numbers. Grid lines are numbered starting at 1 from the left/top edge."),
      code("css", `.featured {
  /* Span from column line 1 to 3 (takes up 2 columns) */
  grid-column: 1 / 3;

  /* Span from row line 1 to 3 (takes up 2 rows) */
  grid-row: 1 / 3;
}

/* Shorthand: span keyword */
.wide-item {
  grid-column: span 2; /* Takes 2 columns from current position */
}

.tall-item {
  grid-row: span 3; /* Takes 3 rows from current position */
}`, "grid-placement.css"),

      h2("Alignment and Justification"),
      p("Grid provides powerful alignment controls at both the container and item level."),
      code("css", `/* Container-level alignment */
.grid {
  /* Align all items horizontally within their cells */
  justify-items: center; /* start | end | center | stretch */

  /* Align all items vertically within their cells */
  align-items: center;

  /* Shorthand for both */
  place-items: center;
}

/* Individual item alignment */
.special-item {
  justify-self: end;
  align-self: start;
}

/* Align the entire grid within its container */
.grid {
  justify-content: center; /* Useful when grid is smaller than container */
  align-content: space-between;
}`, "alignment.css"),

      h2("Real-World Layout: Dashboard"),
      p("Let us build a complete dashboard layout that is fully responsive using only CSS Grid."),
      code("css", `.dashboard {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  grid-template-areas:
    "nav header"
    "nav main";
  height: 100vh;
}

.dashboard-nav    { grid-area: nav; }
.dashboard-header { grid-area: header; }
.dashboard-main   { grid-area: main; overflow-y: auto; }

/* Stats cards inside the main area */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

/* Make it responsive */
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
    grid-template-rows: 64px auto 1fr;
    grid-template-areas:
      "header"
      "nav"
      "main";
  }
}`, "dashboard.css"),

      h2("Common Grid Patterns"),
      h3("Holy Grail Layout"),
      p("Header, footer, main content with two sidebars — the classic layout that was infamously difficult before Grid:"),
      code("css", `.holy-grail {
  display: grid;
  grid-template: auto 1fr auto / 200px 1fr 200px;
  min-height: 100vh;
}

.hg-header { grid-column: 1 / -1; }
.hg-footer { grid-column: 1 / -1; }`, "holy-grail.css"),

      h3("Masonry-Style Layout"),
      p("While true masonry is still experimental in CSS, you can approximate it with Grid:"),
      code("css", `.masonry {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 20px;
  gap: 1rem;
}

.masonry-item.small  { grid-row: span 8; }
.masonry-item.medium { grid-row: span 12; }
.masonry-item.large  { grid-row: span 16; }`, "masonry.css"),

      h2("Key Takeaways"),
      ...bullet([
        "Use display: grid to create a grid container — define columns with grid-template-columns",
        "The fr unit distributes available space proportionally and is preferred over percentages",
        "grid-template-areas provides the most readable way to define layouts",
        "repeat(auto-fill, minmax(min, 1fr)) creates responsive grids without media queries",
        "Grid and Flexbox are complementary — use Grid for layout, Flexbox for alignment",
      ]),
      callout("tip", "When in doubt, start with Flexbox. If you find yourself nesting Flexbox containers to create a two-dimensional layout, switch to Grid."),
    ],
  },

  // ─── POST 3 ───────────────────────────────────────────────
  {
    title: "Prisma ORM: From Zero to Production",
    excerpt: "A deep dive into Prisma ORM covering schema design, migrations, queries, relations, and production best practices for Node.js applications.",
    categoryName: "Databases",
    tagNames: ["Prisma & ORMs", "PostgreSQL"],
    readingTime: 14,
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1400&q=80",
    imageAlt: "Database architecture visualization",
    content: [
      h2("What Is Prisma and Why Use It?"),
      p("Prisma is a next-generation ORM for Node.js and TypeScript that replaces traditional ORMs like Sequelize and TypeORM. It takes a fundamentally different approach: instead of defining models in JavaScript classes, you write a declarative schema file and Prisma generates a fully type-safe client."),
      p("This means every query you write is validated at compile time. If you reference a field that does not exist, TypeScript catches it before you ever run the code. Combined with auto-completion in your editor, Prisma makes database work feel almost effortless."),
      callout("info", "Prisma supports PostgreSQL, MySQL, SQLite, SQL Server, MongoDB, and CockroachDB. This guide uses PostgreSQL, but the concepts apply to all supported databases."),

      h2("Setting Up Prisma"),
      p("Install Prisma and initialize your project:"),
      code("bash", `npm install prisma @prisma/client
npx prisma init`, "terminal"),
      p("This creates a prisma/ directory with a schema.prisma file and a .env file for your database connection string."),

      h2("Designing Your Schema"),
      p("The schema file is the heart of Prisma. It defines your data models, relations, and database configuration in a clean, readable format."),
      code("prisma", `// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Profile {
  id     String @id @default(cuid())
  bio    String?
  avatar String?
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Post {
  id          String     @id @default(cuid())
  title       String
  slug        String     @unique
  content     String
  published   Boolean    @default(false)
  authorId    String
  author      User       @relation(fields: [authorId], references: [id])
  categories  Category[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([authorId])
  @@index([slug])
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}

enum Role {
  USER
  ADMIN
}`, "prisma/schema.prisma"),

      h2("Understanding Relations"),
      p("Prisma supports all standard relation types. Here is how each one works:"),
      h3("One-to-One"),
      p("A User has one Profile. The @unique constraint on userId ensures the one-to-one relationship. The onDelete: Cascade means deleting a user also deletes their profile."),
      h3("One-to-Many"),
      p("A User has many Posts. The authorId field and @relation directive create the foreign key. The posts field on User is a virtual relation field — it does not exist in the database but lets you query related posts."),
      h3("Many-to-Many"),
      p("Posts and Categories have a many-to-many relationship. Prisma handles the join table automatically — you never need to create or manage it yourself."),

      h2("Migrations"),
      p("After changing your schema, create a migration to update the database:"),
      code("bash", `# Create and apply a migration
npx prisma migrate dev --name add_user_profile

# In production, apply pending migrations
npx prisma migrate deploy

# Reset the database (development only!)
npx prisma migrate reset`, "terminal"),
      callout("warning", "Never use 'prisma migrate reset' or 'prisma db push' in production. Always use 'prisma migrate deploy' which applies only pending migrations safely."),

      h2("CRUD Operations"),
      p("Prisma Client provides an intuitive API for all database operations:"),
      h3("Creating Records"),
      code("typescript", `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a user with a profile (nested create)
const user = await prisma.user.create({
  data: {
    email: "alice@example.com",
    name: "Alice",
    profile: {
      create: {
        bio: "Full-stack developer",
      },
    },
  },
  include: {
    profile: true,
  },
});

// Create a post with categories
const post = await prisma.post.create({
  data: {
    title: "My First Post",
    slug: "my-first-post",
    content: "Hello world!",
    author: { connect: { id: user.id } },
    categories: {
      connectOrCreate: [
        {
          where: { name: "TypeScript" },
          create: { name: "TypeScript" },
        },
      ],
    },
  },
});`, "queries.ts"),

      h3("Reading Records"),
      code("typescript", `// Find one by unique field
const user = await prisma.user.findUnique({
  where: { email: "alice@example.com" },
  include: { posts: true, profile: true },
});

// Find many with filtering, sorting, and pagination
const posts = await prisma.post.findMany({
  where: {
    published: true,
    author: { role: "ADMIN" },
    title: { contains: "prisma", mode: "insensitive" },
  },
  orderBy: { createdAt: "desc" },
  skip: 0,
  take: 10,
  select: {
    id: true,
    title: true,
    author: { select: { name: true } },
  },
});

// Aggregations
const stats = await prisma.post.aggregate({
  _count: { id: true },
  where: { published: true },
});`, "read-queries.ts"),

      h3("Updating and Deleting"),
      code("typescript", `// Update one record
await prisma.user.update({
  where: { id: userId },
  data: { name: "Alice Updated" },
});

// Update many
await prisma.post.updateMany({
  where: { authorId: userId, published: false },
  data: { published: true },
});

// Upsert — create if not exists, update if exists
await prisma.user.upsert({
  where: { email: "bob@example.com" },
  create: { email: "bob@example.com", name: "Bob" },
  update: { name: "Bob Updated" },
});

// Delete with cascade
await prisma.user.delete({
  where: { id: userId },
  // Profile is deleted automatically due to onDelete: Cascade
});`, "update-delete.ts"),

      h2("Transactions"),
      p("When you need multiple operations to succeed or fail together, use Prisma transactions:"),
      code("typescript", `// Interactive transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: "charlie@example.com", name: "Charlie" },
  });

  const post = await tx.post.create({
    data: {
      title: "Transaction Post",
      slug: "transaction-post",
      content: "Created in a transaction",
      authorId: user.id,
    },
  });

  return { user, post };
});
// If any operation fails, both are rolled back`, "transactions.ts"),

      h2("Production Best Practices"),
      ...bullet([
        "Use a singleton pattern for PrismaClient to avoid exhausting database connections",
        "Always use select or include to fetch only the data you need",
        "Add @@index to fields you frequently filter or sort by",
        "Use prisma migrate deploy in CI/CD pipelines, never prisma db push",
        "Set connection pool size via the connection string: ?connection_limit=5",
        "Enable query logging in development: new PrismaClient({ log: ['query'] })",
      ]),
      h3("Singleton Pattern"),
      code("typescript", `// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}`, "lib/prisma.ts"),

      h2("Key Takeaways"),
      p("Prisma transforms database work from a chore into a delight. The type-safe client catches errors at compile time, the schema file provides a clear source of truth, and the migration system keeps your database in sync across environments. For any Node.js or TypeScript project that touches a database, Prisma should be your first choice."),
      callout("tip", "Run 'npx prisma studio' to open a visual database browser. It is incredibly useful during development for inspecting data and debugging queries."),
    ],
  },

  // ─── POST 4 ───────────────────────────────────────────────
  {
    title: "Python Flask vs FastAPI: Building Modern APIs",
    excerpt: "Compare Flask and FastAPI by building the same REST API with both frameworks. Learn when to choose each and how to get the best performance.",
    categoryName: "Backend Technologies",
    tagNames: ["Python"],
    readingTime: 12,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1400&q=80",
    imageAlt: "Python programming code on screen",
    content: [
      h2("Flask vs FastAPI: The Showdown"),
      p("Flask has been the go-to Python web framework for over a decade. It is minimal, flexible, and has a massive ecosystem. FastAPI is the newcomer that has taken the Python community by storm with automatic documentation, type validation, and async support out of the box."),
      p("Rather than declaring a winner, we will build the same API with both frameworks so you can make an informed decision for your next project. We will create a simple task management API with CRUD operations."),

      h2("Setting Up Flask"),
      code("bash", `pip install flask flask-cors
mkdir flask-api && cd flask-api`, "terminal"),
      code("python", `# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from uuid import uuid4
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory storage (use a database in production)
tasks = {}


@app.route("/tasks", methods=["GET"])
def get_tasks():
    status = request.args.get("status")
    result = list(tasks.values())
    if status:
        result = [t for t in result if t["status"] == status]
    return jsonify(result)


@app.route("/tasks", methods=["POST"])
def create_task():
    data = request.get_json()
    if not data or not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    task_id = str(uuid4())
    task = {
        "id": task_id,
        "title": data["title"],
        "description": data.get("description", ""),
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
    }
    tasks[task_id] = task
    return jsonify(task), 201


@app.route("/tasks/<task_id>", methods=["PUT"])
def update_task(task_id):
    if task_id not in tasks:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json()
    task = tasks[task_id]
    task["title"] = data.get("title", task["title"])
    task["description"] = data.get("description", task["description"])
    task["status"] = data.get("status", task["status"])
    return jsonify(task)


@app.route("/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    if task_id not in tasks:
        return jsonify({"error": "Task not found"}), 404
    del tasks[task_id]
    return "", 204


if __name__ == "__main__":
    app.run(debug=True, port=5000)`, "app.py"),

      h2("Setting Up FastAPI"),
      code("bash", `pip install fastapi uvicorn
mkdir fastapi-app && cd fastapi-app`, "terminal"),
      code("python", `# main.py
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from uuid import uuid4
from datetime import datetime
from enum import Enum

app = FastAPI(title="Task API", version="1.0.0")

# In-memory storage
tasks = {}


class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
    status: TaskStatus | None = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    status: TaskStatus
    created_at: str


@app.get("/tasks", response_model=list[TaskResponse])
async def get_tasks(status: TaskStatus | None = Query(None)):
    result = list(tasks.values())
    if status:
        result = [t for t in result if t["status"] == status]
    return result


@app.post("/tasks", response_model=TaskResponse, status_code=201)
async def create_task(data: TaskCreate):
    task_id = str(uuid4())
    task = {
        "id": task_id,
        "title": data.title,
        "description": data.description,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
    }
    tasks[task_id] = task
    return task


@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, data: TaskUpdate):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = tasks[task_id]
    update = data.model_dump(exclude_unset=True)
    task.update(update)
    return task


@app.delete("/tasks/{task_id}", status_code=204)
async def delete_task(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    del tasks[task_id]`, "main.py"),
      p("Run it with: uvicorn main:app --reload"),

      h2("Key Differences"),
      h3("Type Safety and Validation"),
      p("The biggest difference is immediately visible. FastAPI uses Pydantic models for automatic request validation. If someone sends an invalid request, FastAPI returns a detailed error response without you writing a single line of validation code. With Flask, you must validate everything manually."),

      h3("Auto-Generated Documentation"),
      p("FastAPI automatically generates interactive API documentation. Visit /docs for Swagger UI or /redocs for ReDoc. Flask requires extensions like flask-restx or flasgger for similar functionality."),

      h3("Async Support"),
      code("python", `# FastAPI — native async
@app.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await database.fetch_one("SELECT * FROM users WHERE id = $1", user_id)
    return user

# Flask — requires additional setup with quart or async views (Flask 2.0+)
@app.route("/users/<user_id>")
async def get_user(user_id):
    user = await database.fetch_one("SELECT * FROM users WHERE id = $1", user_id)
    return jsonify(user)`, "async-comparison.py"),

      h2("Performance Benchmarks"),
      p("We ran benchmarks using wrk with 100 concurrent connections for 30 seconds:"),
      ...bullet([
        "Flask (Gunicorn, 4 workers): ~2,800 requests/second",
        "FastAPI (Uvicorn, 4 workers): ~8,500 requests/second",
        "FastAPI is roughly 3x faster due to its ASGI foundation and async capabilities",
      ]),
      callout("info", "These benchmarks use simple JSON responses. Real-world performance depends heavily on your database queries and business logic."),

      h2("When to Use Flask"),
      ...bullet([
        "You need maximum flexibility and want to choose every component",
        "Your team is already experienced with Flask",
        "You are building a simple web app with server-rendered templates",
        "You need specific Flask extensions that have no FastAPI equivalent",
      ]),

      h2("When to Use FastAPI"),
      ...bullet([
        "You are building a modern REST or GraphQL API",
        "Type safety and auto-validation are important to you",
        "You need async support for high-concurrency workloads",
        "You want auto-generated documentation for your API",
        "You are starting a new project with no legacy constraints",
      ]),

      h2("Key Takeaways"),
      p("Both frameworks are excellent choices. Flask gives you freedom and a proven ecosystem. FastAPI gives you speed, type safety, and modern Python features out of the box. For new API projects, FastAPI is the stronger choice. For web apps with templates or when leveraging existing Flask extensions, Flask remains perfectly viable."),
      callout("tip", "You can use both in the same project. Build your user-facing web app with Flask and your performance-critical API endpoints with FastAPI, running them behind a reverse proxy."),
    ],
  },

  // ─── POST 5 ───────────────────────────────────────────────
  {
    title: "Deploying Full-Stack Apps to Vercel: The Definitive Guide",
    excerpt: "Everything you need to know about deploying Next.js and full-stack applications to Vercel — environment variables, databases, edge functions, and CI/CD.",
    categoryName: "Cloud & Hosting",
    tagNames: ["Vercel", "Next.js"],
    readingTime: 10,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&q=80",
    imageAlt: "Cloud infrastructure with connected nodes",
    content: [
      h2("Why Vercel for Full-Stack Deployment"),
      p("Vercel was built by the creators of Next.js, so it provides first-class support for Next.js applications. But it is far more than a Next.js host — it supports any frontend framework and provides serverless functions, edge computing, and database integrations that make it a complete full-stack platform."),
      p("In this guide we will walk through deploying a real application with a database, authentication, environment variables, and a proper CI/CD pipeline."),

      h2("Initial Setup"),
      p("Start by installing the Vercel CLI and linking your project:"),
      code("bash", `# Install Vercel CLI globally
npm i -g vercel

# Log in to your account
vercel login

# Link your project (run from your project root)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod`, "terminal"),
      callout("tip", "The easiest way to deploy is to connect your GitHub repository. Every push to main deploys to production, and every pull request gets a unique preview URL."),

      h2("Environment Variables"),
      p("Never commit secrets to your repository. Vercel provides a secure way to manage environment variables across different environments."),
      code("bash", `# Add environment variables via CLI
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production preview development

# Pull environment variables to .env.local for local development
vercel env pull .env.local`, "terminal"),
      p("In the Vercel dashboard, navigate to Settings > Environment Variables. You can set variables for Production, Preview, and Development environments separately. This is critical for using different databases in staging vs production."),

      h2("Database Setup"),
      p("Vercel integrates with several database providers. Here is how to connect a PostgreSQL database using Vercel Postgres or an external provider:"),
      h3("Option 1: Vercel Postgres"),
      code("bash", `# Install the Vercel Postgres SDK
npm install @vercel/postgres`, "terminal"),
      code("typescript", `// lib/db.ts
import { sql } from "@vercel/postgres";

export async function getUsers() {
  const { rows } = await sql\`SELECT * FROM users ORDER BY created_at DESC\`;
  return rows;
}

export async function createUser(name: string, email: string) {
  const { rows } = await sql\`
    INSERT INTO users (name, email)
    VALUES (\${name}, \${email})
    RETURNING *
  \`;
  return rows[0];
}`, "lib/db.ts"),

      h3("Option 2: External Database (Supabase, Neon, PlanetScale)"),
      p("For external databases, simply add the connection string as an environment variable and use your preferred ORM:"),
      code("typescript", `// With Prisma — works with any PostgreSQL provider
// Set DATABASE_URL in Vercel environment variables
// prisma/schema.prisma
// datasource db {
//   provider  = "postgresql"
//   url       = env("DATABASE_URL")
//   directUrl = env("DIRECT_URL")  // For migrations
// }`, "prisma-config.ts"),
      callout("warning", "If using Prisma with serverless providers, add ?pgbouncer=true to your DATABASE_URL and use a separate DIRECT_URL without pooling for migrations."),

      h2("Serverless and Edge Functions"),
      p("Vercel automatically converts your API routes into serverless functions. You can also use edge functions for lower latency:"),
      code("typescript", `// app/api/hello/route.ts — Serverless Function (Node.js runtime)
export async function GET() {
  return Response.json({ message: "Hello from serverless!" });
}

// app/api/fast/route.ts — Edge Function (runs closer to the user)
export const runtime = "edge";

export async function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country") || "unknown";
  return Response.json({
    message: \`Hello from the edge in \${country}!\`,
  });
}`, "api-routes.ts"),
      ...bullet([
        "Serverless functions: Full Node.js runtime, up to 60s execution time on Pro plan",
        "Edge functions: Limited runtime, but execute in ~25ms at the nearest data center",
        "Use edge for latency-sensitive endpoints like auth checks and A/B testing",
        "Use serverless for database queries and complex business logic",
      ]),

      h2("Build Configuration"),
      p("Customize your build in vercel.json:"),
      code("json", `{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=60, stale-while-revalidate" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/blog/:path*", "destination": "/blog/:path*" }
  ]
}`, "vercel.json"),

      h2("CI/CD Pipeline"),
      p("Vercel's Git integration provides a complete CI/CD pipeline out of the box:"),
      ...bullet([
        "Push to main branch → automatic production deployment",
        "Open a pull request → preview deployment with a unique URL",
        "Preview deployments run the same build process as production",
        "GitHub status checks show build status directly in the PR",
      ]),
      h3("Ignoring Builds"),
      p("Save build minutes by skipping unnecessary deploys:"),
      code("bash", `#!/bin/bash
# vercel-ignore-build.sh
# Only deploy if the app directory has changes

echo "Checking for changes..."
git diff HEAD^ HEAD --quiet ./src ./public ./package.json

if [ $? -eq 0 ]; then
  echo "No changes — skipping build"
  exit 0
else
  echo "Changes detected — proceeding with build"
  exit 1
fi`, "vercel-ignore-build.sh"),

      h2("Monitoring and Analytics"),
      p("Vercel provides built-in tools to monitor your application in production:"),
      ...bullet([
        "Web Analytics: Page views, unique visitors, top pages, referrers",
        "Speed Insights: Real User Monitoring (RUM) for Core Web Vitals",
        "Logs: Real-time function logs with filtering and search",
        "Usage: Function invocations, bandwidth, and build minutes",
      ]),

      h2("Key Takeaways"),
      p("Vercel makes deployment almost invisible. Push your code, and it handles the rest — builds, CDN distribution, SSL certificates, and serverless function deployment. For Next.js applications especially, it is the most frictionless deployment platform available."),
      callout("tip", "Use 'vercel --prod' for production deploys from the CLI, and 'vercel' (without --prod) for preview deployments that you can share with teammates for review."),
    ],
  },

  // ─── POST 6 ───────────────────────────────────────────────
  {
    title: "Supabase Authentication: Complete Guide with Next.js",
    excerpt: "Implement email, OAuth, and magic link authentication in your Next.js app using Supabase Auth. Covers server-side sessions, middleware, and row-level security.",
    categoryName: "Backend-as-a-Service",
    tagNames: ["Supabase"],
    readingTime: 13,
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1400&q=80",
    imageAlt: "Secure lock and code on a screen",
    content: [
      h2("Why Supabase for Authentication"),
      p("Supabase provides a complete authentication system that handles email/password, OAuth providers, magic links, and phone auth. Unlike rolling your own auth, Supabase Auth integrates directly with its database through Row Level Security (RLS), meaning your authorization rules live in the database itself."),
      p("In this guide we will implement authentication in a Next.js application with server-side session handling, protected routes via middleware, and RLS policies that ensure users can only access their own data."),

      h2("Project Setup"),
      code("bash", `npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npm install @supabase/supabase-js @supabase/ssr`, "terminal"),
      p("Create a Supabase project at supabase.com and grab your project URL and anon key from the project settings."),
      code("bash", `# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`, ".env.local"),

      h2("Creating the Supabase Client"),
      p("With the @supabase/ssr package, you need different clients for server and client components:"),
      h3("Browser Client"),
      code("typescript", `// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}`, "lib/supabase/client.ts"),
      h3("Server Client"),
      code("typescript", `// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}`, "lib/supabase/server.ts"),

      h2("Authentication Flows"),
      h3("Email and Password Sign Up"),
      code("typescript", `// app/auth/signup/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: \`\${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback\`,
    },
  });

  if (error) {
    return redirect("/auth/signup?error=" + encodeURIComponent(error.message));
  }

  return redirect("/auth/verify-email");
}`, "app/auth/signup/actions.ts"),

      h3("OAuth (Google, GitHub)"),
      code("typescript", `// app/auth/oauth/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: \`\${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback\`,
    },
  });

  if (error) throw error;
  return redirect(data.url);
}`, "app/auth/oauth/actions.ts"),

      h3("Auth Callback Route"),
      code("typescript", `// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(\`\${origin}/dashboard\`);
    }
  }

  return NextResponse.redirect(\`\${origin}/auth/login?error=auth_failed\`);
}`, "app/auth/callback/route.ts"),

      h2("Middleware for Protected Routes"),
      p("Use Next.js middleware to protect routes and refresh sessions:"),
      code("typescript", `// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};`, "middleware.ts"),
      callout("warning", "Always use supabase.auth.getUser() in middleware, not getSession(). getSession() reads from the JWT without verifying it with Supabase, which could be spoofed."),

      h2("Row Level Security"),
      p("RLS policies let the database enforce authorization rules. This means even if there is a bug in your application code, users cannot access data they should not see."),
      code("sql", `-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);`, "rls-policies.sql"),

      h2("Getting the User in Server Components"),
      code("typescript", `// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div>
      <h1>Welcome, {profile?.full_name || user.email}</h1>
    </div>
  );
}`, "app/dashboard/page.tsx"),

      h2("Sign Out"),
      code("typescript", `// components/SignOutButton.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}`, "components/SignOutButton.tsx"),

      h2("Key Takeaways"),
      ...bullet([
        "Use @supabase/ssr for proper cookie-based sessions in Next.js",
        "Create separate clients for browser and server components",
        "Always verify sessions with getUser() in middleware, not getSession()",
        "Row Level Security provides defense-in-depth authorization at the database level",
        "OAuth providers like Google and GitHub need redirect URLs configured in the Supabase dashboard",
      ]),
      callout("tip", "Enable email confirmation in production (Authentication > Settings in your Supabase dashboard). In development, you can disable it to speed up testing."),
    ],
  },

  // ─── POST 7 ───────────────────────────────────────────────
  {
    title: "Mastering Go for Web Development: A Practical Introduction",
    excerpt: "Learn Go by building a production-ready REST API. Covers the standard library, concurrency, error handling, and why Go is the fastest-growing backend language.",
    categoryName: "Backend Technologies",
    tagNames: ["Go (Golang)"],
    readingTime: 14,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=1400&q=80",
    imageAlt: "Server infrastructure in a data center",
    content: [
      h2("Why Go for Web Development"),
      p("Go was created at Google to solve the problems of building large-scale, high-performance server software. It compiles to a single binary with no dependencies, starts in milliseconds, and handles thousands of concurrent connections with minimal memory. For backend web development, these properties make Go exceptional."),
      p("In this article we will build a REST API from scratch using only Go's standard library. No frameworks — just pure Go. This approach will teach you how Go works at a fundamental level and show you why its simplicity is its greatest strength."),
      callout("info", "Go 1.22+ includes the enhanced ServeMux with method matching and path parameters, making external routers like gorilla/mux unnecessary for most APIs."),

      h2("Setting Up Your First Go Project"),
      code("bash", `# Create a new module
mkdir go-api && cd go-api
go mod init github.com/yourname/go-api

# Create the entry point
touch main.go`, "terminal"),

      h2("A Basic HTTP Server"),
      code("go", `package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	fmt.Println("Server running on :8080")
	log.Fatal(server.ListenAndServe())
}`, "main.go"),
      p("Notice the method pattern in the route: GET /health. This is new in Go 1.22 and means this handler only responds to GET requests. Previously you had to check the method manually inside the handler."),

      h2("Building a Complete CRUD API"),
      p("Let us build a bookmarks API with in-memory storage. We will cover the patterns you will use in every Go web application."),
      h3("Data Model and Store"),
      code("go", `// models.go
package main

import (
	"sync"
	"time"
)

type Bookmark struct {
	ID        string    \`json:"id"\`
	URL       string    \`json:"url"\`
	Title     string    \`json:"title"\`
	Tags      []string  \`json:"tags"\`
	CreatedAt time.Time \`json:"created_at"\`
}

type BookmarkStore struct {
	mu        sync.RWMutex
	bookmarks map[string]Bookmark
}

func NewBookmarkStore() *BookmarkStore {
	return &BookmarkStore{
		bookmarks: make(map[string]Bookmark),
	}
}

func (s *BookmarkStore) GetAll() []Bookmark {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]Bookmark, 0, len(s.bookmarks))
	for _, b := range s.bookmarks {
		result = append(result, b)
	}
	return result
}

func (s *BookmarkStore) GetByID(id string) (Bookmark, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	b, ok := s.bookmarks[id]
	return b, ok
}

func (s *BookmarkStore) Create(b Bookmark) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.bookmarks[b.ID] = b
}

func (s *BookmarkStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.bookmarks[id]; !ok {
		return false
	}
	delete(s.bookmarks, id)
	return true
}`, "models.go"),

      h3("Route Handlers"),
      code("go", `// handlers.go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type API struct {
	store *BookmarkStore
}

func (a *API) handleGetBookmarks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(a.store.GetAll())
}

func (a *API) handleGetBookmark(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	bookmark, ok := a.store.GetByID(id)
	if !ok {
		http.Error(w, \`{"error": "not found"}\`, http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookmark)
}

func (a *API) handleCreateBookmark(w http.ResponseWriter, r *http.Request) {
	var input struct {
		URL   string   \`json:"url"\`
		Title string   \`json:"title"\`
		Tags  []string \`json:"tags"\`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, \`{"error": "invalid JSON"}\`, http.StatusBadRequest)
		return
	}

	if input.URL == "" || input.Title == "" {
		http.Error(w, \`{"error": "url and title required"}\`, http.StatusBadRequest)
		return
	}

	bookmark := Bookmark{
		ID:        fmt.Sprintf("%d", time.Now().UnixNano()),
		URL:       input.URL,
		Title:     input.Title,
		Tags:      input.Tags,
		CreatedAt: time.Now(),
	}

	a.store.Create(bookmark)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(bookmark)
}

func (a *API) handleDeleteBookmark(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !a.store.Delete(id) {
		http.Error(w, \`{"error": "not found"}\`, http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}`, "handlers.go"),

      h2("Concurrency in Go"),
      p("Go's goroutines and channels are what make it exceptional for web servers. Each incoming HTTP request is automatically handled in its own goroutine, which is why we use sync.RWMutex to protect our shared data."),
      code("go", `// Example: Fetch multiple URLs concurrently
func fetchAll(urls []string) []string {
	results := make([]string, len(urls))
	var wg sync.WaitGroup

	for i, url := range urls {
		wg.Add(1)
		go func(i int, url string) {
			defer wg.Done()
			resp, err := http.Get(url)
			if err != nil {
				results[i] = fmt.Sprintf("error: %v", err)
				return
			}
			defer resp.Body.Close()
			results[i] = fmt.Sprintf("%s: %d", url, resp.StatusCode)
		}(i, url)
	}

	wg.Wait()
	return results
}`, "concurrency.go"),
      callout("tip", "A goroutine uses only ~2KB of stack memory (compared to ~1MB for an OS thread). You can easily run millions of goroutines on a single machine."),

      h2("Error Handling"),
      p("Go does not have exceptions. Instead, functions return errors as values. This explicit approach forces you to handle errors at every step, resulting in more reliable code."),
      code("go", `// Go's error handling pattern
func processFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("reading file %s: %w", path, err)
	}

	result, err := parse(data)
	if err != nil {
		return fmt.Errorf("parsing data: %w", err)
	}

	if err := save(result); err != nil {
		return fmt.Errorf("saving result: %w", err)
	}

	return nil
}`, "errors.go"),

      h2("Middleware Pattern"),
      code("go", `// Middleware in Go is just a function that wraps an http.Handler
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Chain middleware
handler := loggingMiddleware(corsMiddleware(mux))`, "middleware.go"),

      h2("Key Takeaways"),
      ...bullet([
        "Go compiles to a single binary — no runtime dependencies, no container needed for simple deployments",
        "The standard library's net/http package is production-ready — you rarely need a framework",
        "Go 1.22's enhanced ServeMux supports method matching and path parameters natively",
        "Goroutines provide massive concurrency with minimal memory overhead",
        "Explicit error handling produces more reliable code than exception-based approaches",
        "Use sync.RWMutex for concurrent access to shared state in web servers",
      ]),
      callout("tip", "Start with the standard library. Only add external packages when you have a specific need that the standard library cannot meet. This keeps your dependency tree small and your builds fast."),
    ],
  },

  // ─── POST 8 ───────────────────────────────────────────────
  {
    title: "Tailwind CSS v4: What's New and How to Migrate",
    excerpt: "A comprehensive look at Tailwind CSS v4's new features — CSS-first configuration, Lightning CSS engine, native container queries, and a complete migration guide.",
    categoryName: "CSS Ecosystem",
    tagNames: ["Tailwind CSS"],
    readingTime: 10,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=1400&q=80",
    imageAlt: "Colorful design pattern on a screen",
    content: [
      h2("Tailwind CSS v4: A New Foundation"),
      p("Tailwind CSS v4 is a ground-up rewrite that replaces PostCSS with a custom-built engine powered by Lightning CSS. The result is dramatically faster builds (up to 10x), a simpler configuration model, and new CSS-native features that were impossible before."),
      p("This article covers the most important changes and provides a step-by-step migration guide for existing projects."),

      h2("CSS-First Configuration"),
      p("The biggest change in v4 is that configuration moves from JavaScript (tailwind.config.js) to CSS. Your main CSS file becomes the single source of truth."),
      h3("Before (v3)"),
      code("javascript", `// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#3b82f6",
        surface: "#1a1a2e",
      },
      fontFamily: {
        heading: ["Cal Sans", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};`, "tailwind.config.js"),
      h3("After (v4)"),
      code("css", `/* app.css — all configuration lives here now */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-brand: #3b82f6;
  --color-surface: #1a1a2e;
  --font-heading: "Cal Sans", sans-serif;
}`, "app.css"),
      callout("info", "The @theme directive replaces the entire theme.extend section of tailwind.config.js. Every value becomes a CSS custom property that you can reference anywhere."),

      h2("Lightning CSS Engine"),
      p("Tailwind v4 replaces PostCSS with Lightning CSS, a Rust-based CSS transformer. This brings massive performance improvements:"),
      ...bullet([
        "Full builds are up to 10x faster",
        "Incremental builds (during development) are up to 100x faster",
        "Automatic vendor prefixing built-in (no more autoprefixer)",
        "Native CSS nesting support without additional plugins",
        "Modern color functions like oklch() handled automatically",
      ]),

      h2("Automatic Content Detection"),
      p("In v4, you no longer need to configure content paths. Tailwind automatically detects your source files based on your project structure:"),
      code("css", `/* v3 required explicit content configuration */
/* v4 automatically scans your project */

/* If you need to add paths explicitly: */
@source "../other-package/src";

/* Or exclude paths: */
@source not "../irrelevant-folder";`, "content-detection.css"),

      h2("Native Container Queries"),
      p("Container queries are now built into Tailwind without any plugin:"),
      code("html", `<!-- Mark an element as a container -->
<div class="@container">
  <!-- Respond to the container's width, not the viewport -->
  <div class="flex flex-col @md:flex-row @lg:grid @lg:grid-cols-3 gap-4">
    <div class="@sm:p-6 p-4">
      Responsive to its container!
    </div>
  </div>
</div>

<!-- Named containers for nested queries -->
<div class="@container/sidebar">
  <div class="@md/sidebar:hidden">
    Hidden when sidebar container is medium or wider
  </div>
</div>`, "container-queries.html"),

      h2("New Utility Classes"),
      p("Tailwind v4 adds several new utilities:"),
      h3("Logical Properties"),
      code("html", `<!-- Physical (LTR-only) -->
<div class="ml-4 pl-6 border-l">

<!-- Logical (works in LTR and RTL) -->
<div class="ms-4 ps-6 border-s">

<!-- ms = margin-inline-start -->
<!-- ps = padding-inline-start -->
<!-- border-s = border-inline-start -->`, "logical-properties.html"),

      h3("Field Sizing"),
      code("html", `<!-- Textarea that auto-grows with content -->
<textarea class="field-sizing-content min-h-20 max-h-64">
</textarea>`, "field-sizing.html"),

      h3("Color Mix"),
      code("html", `<!-- 50% opacity using color-mix -->
<div class="bg-blue-500/50">

<!-- Mix two theme colors -->
<div class="bg-mix-blue-500-red-500">`, "color-mix.html"),

      h2("Migration Guide"),
      p("Follow these steps to migrate from Tailwind v3 to v4:"),
      h3("Step 1: Update Dependencies"),
      code("bash", `# Remove old packages
npm uninstall tailwindcss postcss autoprefixer

# Install v4
npm install tailwindcss@latest @tailwindcss/vite

# If using the typography plugin
npm install @tailwindcss/typography@latest`, "terminal"),

      h3("Step 2: Update Vite/Next.js Config"),
      code("typescript", `// vite.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});

// For Next.js — no config needed, it's automatic in Next.js 15+`, "vite.config.ts"),

      h3("Step 3: Migrate CSS"),
      code("css", `/* Replace the v3 directives */

/* Before (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* After (v4) */
@import "tailwindcss";`, "migration.css"),

      h3("Step 4: Move Theme Config"),
      p("Move your theme customizations from tailwind.config.js to @theme in your CSS file. The naming convention changes from camelCase to kebab-case:"),
      code("css", `@theme {
  /* colors.brand.primary → --color-brand-primary */
  --color-brand-primary: #3b82f6;
  --color-brand-secondary: #8b5cf6;

  /* fontFamily.sans → --font-sans */
  --font-sans: "Inter", sans-serif;

  /* spacing.18 → --spacing-18 */
  --spacing-18: 4.5rem;

  /* borderRadius.xl → --radius-xl */
  --radius-xl: 1rem;
}`, "theme-migration.css"),

      h3("Step 5: Run the Upgrade Tool"),
      code("bash", `# Tailwind provides an automated upgrade tool
npx @tailwindcss/upgrade`, "terminal"),
      callout("tip", "The upgrade tool handles most breaking changes automatically, including renaming deprecated utilities and updating your CSS imports. Always review the changes it makes before committing."),

      h2("Key Takeaways"),
      ...bullet([
        "v4 moves configuration from JavaScript to CSS with the @theme directive",
        "Lightning CSS engine provides 10-100x faster builds",
        "Content detection is automatic — no more configuring content paths",
        "Container queries, logical properties, and field-sizing are built-in",
        "Use the @tailwindcss/upgrade tool to automate most migration steps",
      ]),
    ],
  },

  // ─── POST 9 ───────────────────────────────────────────────
  {
    title: "GraphQL vs REST: When to Use Each in 2025",
    excerpt: "An honest comparison of GraphQL and REST APIs with real production examples. Learn the strengths, weaknesses, and ideal use cases for each approach.",
    categoryName: "APIs & Integrations",
    tagNames: ["GraphQL", "REST API Design"],
    readingTime: 11,
    isPremium: false,
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&q=80",
    imageAlt: "Network connections and API architecture",
    content: [
      h2("The Debate That Will Not Die"),
      p("GraphQL vs REST is one of the longest-running debates in web development. The truth is that both are excellent technologies, and choosing between them depends on your specific use case, team expertise, and application requirements."),
      p("In this article we will look at both approaches objectively, build the same feature with each, and provide clear guidelines for when to use one over the other."),

      h2("REST API Example"),
      p("Let us build a simple blog API where we need to display a post with its author and comments. With REST, this typically requires multiple endpoints:"),
      code("typescript", `// Fetching a blog post with REST
// Request 1: Get the post
const postRes = await fetch("/api/posts/42");
const post = await postRes.json();
// Response: { id: 42, title: "...", authorId: 7, content: "..." }

// Request 2: Get the author
const authorRes = await fetch(\`/api/users/\${post.authorId}\`);
const author = await authorRes.json();
// Response: { id: 7, name: "Alice", avatar: "...", bio: "..." }

// Request 3: Get the comments
const commentsRes = await fetch(\`/api/posts/42/comments\`);
const comments = await commentsRes.json();
// Response: [{ id: 1, text: "...", userId: 12 }, ...]

// Total: 3 HTTP requests, potential over-fetching of fields`, "rest-example.ts"),

      h2("GraphQL Example"),
      p("With GraphQL, you get exactly the data you need in a single request:"),
      code("graphql", `# Single request — get only what you need
query GetPost {
  post(id: 42) {
    title
    content
    author {
      name
      avatar
    }
    comments(limit: 10) {
      text
      user {
        name
      }
    }
  }
}

# Response matches the query shape exactly — no over-fetching`, "query.graphql"),
      code("typescript", `// Client-side usage
const { data, loading, error } = useQuery(GET_POST, {
  variables: { id: 42 },
});

// data.post.title, data.post.author.name, data.post.comments
// One request, exact data shape`, "graphql-client.ts"),

      h2("REST Strengths"),
      h3("Simplicity"),
      p("REST is conceptually simple. HTTP verbs map to CRUD operations, resources have clear URLs, and status codes communicate the result. Any developer can understand a REST API in minutes."),
      h3("Caching"),
      p("REST leverages HTTP caching natively. The browser, CDNs, and reverse proxies all understand HTTP cache headers. A GET request to /api/posts/42 can be cached at every layer without any special configuration."),
      code("typescript", `// REST caching is effortless
// This response is cacheable at every layer
app.get("/api/posts/:id", (req, res) => {
  res.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.json(post);
});`, "rest-caching.ts"),
      h3("File Uploads"),
      p("REST handles file uploads naturally with multipart/form-data. GraphQL requires workarounds or separate upload endpoints."),

      h2("GraphQL Strengths"),
      h3("No Over-fetching or Under-fetching"),
      p("The client specifies exactly what fields it needs. A mobile app can request minimal data while the web dashboard requests everything — using the same API without backend changes."),
      h3("Type System and Schema"),
      code("graphql", `type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  comments: [Comment!]!
  createdAt: DateTime!
}

type Query {
  post(id: ID!): Post
  posts(page: Int, limit: Int): [Post!]!
  user(id: ID!): User
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!
}`, "schema.graphql"),
      p("The schema serves as a contract between frontend and backend. It is self-documenting and tools like GraphQL Playground let developers explore the API interactively."),

      h3("Single Endpoint"),
      p("GraphQL uses a single /graphql endpoint for all operations. This simplifies API gateway configuration and eliminates the need to version your API."),

      h2("When to Use REST"),
      ...bullet([
        "Simple CRUD applications with predictable data patterns",
        "Public APIs that need to be consumed by third parties",
        "Applications where HTTP caching is critical for performance",
        "File upload and download heavy applications",
        "Microservices communicating with each other",
        "When your team is not familiar with GraphQL",
      ]),

      h2("When to Use GraphQL"),
      ...bullet([
        "Applications with complex, nested data relationships",
        "Mobile apps that need minimal data transfer",
        "Dashboards that display data from many sources",
        "When multiple frontend clients need different data shapes from the same API",
        "Rapidly evolving APIs where the frontend team needs flexibility",
        "When you want auto-generated documentation and type safety",
      ]),

      h2("The Hybrid Approach"),
      p("In practice, many successful applications use both. Here is a sensible pattern:"),
      ...bullet([
        "Use REST for simple, cacheable resources (product catalog, static content)",
        "Use REST for file uploads, webhooks, and third-party integrations",
        "Use GraphQL for the main application data layer where relationships are complex",
        "Use REST for server-to-server communication between microservices",
      ]),
      code("typescript", `// A Next.js app using both REST and GraphQL

// REST for simple, cached data
export async function getStaticProps() {
  const res = await fetch("https://api.example.com/settings", {
    next: { revalidate: 3600 },
  });
  return res.json();
}

// GraphQL for complex, dynamic data
const { data } = await apolloClient.query({
  query: DASHBOARD_QUERY,
  variables: { userId },
});`, "hybrid.ts"),

      h2("Performance Considerations"),
      p("Both can be fast or slow depending on implementation. Watch out for:"),
      ...bullet([
        "GraphQL N+1 problem: Use DataLoader to batch database queries",
        "REST waterfall problem: Consider BFF (Backend for Frontend) pattern",
        "GraphQL query complexity: Set depth limits and complexity scoring",
        "REST pagination: Always paginate list endpoints",
      ]),
      callout("warning", "The biggest GraphQL performance pitfall is the N+1 problem. If each post resolver fetches its author individually, 10 posts means 11 database queries. Always use DataLoader or join-based resolvers."),

      h2("Key Takeaways"),
      p("There is no universal winner. REST wins on simplicity, caching, and ecosystem maturity. GraphQL wins on flexibility, type safety, and developer experience for complex data. Choose based on your actual needs, not hype. And remember — you can always use both."),
    ],
  },

  // ─── POST 10 ──────────────────────────────────────────────
  {
    title: "Testing React Applications: A Complete Strategy",
    excerpt: "Build a comprehensive testing strategy for React apps covering unit tests, integration tests, and end-to-end tests with Vitest, Testing Library, and Playwright.",
    categoryName: "Testing",
    tagNames: ["Jest & Vitest", "Testing Library", "Cypress & Playwright"],
    readingTime: 14,
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1400&q=80",
    imageAlt: "Quality assurance and testing on screens",
    content: [
      h2("The Testing Trophy"),
      p("The traditional testing pyramid suggests many unit tests, fewer integration tests, and minimal end-to-end tests. For React applications, Kent C. Dodds proposed the Testing Trophy, which emphasizes integration tests as the most valuable layer."),
      p("The reasoning is simple: integration tests give you the most confidence that your application works correctly while remaining fast enough to run frequently. They test how components work together, which is where most bugs actually occur."),
      ...bullet([
        "Static Analysis (TypeScript, ESLint) — catches typos and type errors",
        "Unit Tests — pure functions and utilities with no DOM involvement",
        "Integration Tests — components with their dependencies, user interactions",
        "End-to-End Tests — critical user flows through the entire application",
      ]),
      callout("info", "A good testing strategy is not about maximizing code coverage. It is about maximizing confidence that your application works correctly for your users."),

      h2("Setting Up the Test Environment"),
      code("bash", `# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom
npm install -D @playwright/test

# Initialize Playwright
npx playwright install`, "terminal"),
      code("typescript", `// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});`, "vitest.config.ts"),
      code("typescript", `// tests/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});`, "tests/setup.ts"),

      h2("Unit Testing: Pure Functions"),
      p("Unit tests are perfect for pure utility functions, data transformations, and business logic that does not involve React components."),
      code("typescript", `// lib/utils.ts
export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/[\\s-]+/g, "-");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}`, "lib/utils.ts"),
      code("typescript", `// lib/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatPrice, slugify, truncate } from "./utils";

describe("formatPrice", () => {
  it("formats cents to USD", () => {
    expect(formatPrice(1999)).toBe("$19.99");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("supports other currencies", () => {
    expect(formatPrice(1999, "EUR")).toBe("€19.99");
  });
});

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("React & Next.js!")).toBe("react-nextjs");
  });

  it("collapses multiple separators", () => {
    expect(slugify("too   many   spaces")).toBe("too-many-spaces");
  });
});

describe("truncate", () => {
  it("does not truncate short text", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and adds ellipsis", () => {
    expect(truncate("this is a long sentence", 10)).toBe("this is a...");
  });
});`, "lib/utils.test.ts"),

      h2("Integration Testing: Components"),
      p("This is where most of your testing effort should go. Test components as users would interact with them — click buttons, fill forms, and verify what appears on screen."),
      code("tsx", `// components/LoginForm.tsx
"use client";

import { useState } from "react";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      {error && <p role="alert" className="text-red-500">{error}</p>}
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}`, "components/LoginForm.tsx"),
      code("typescript", `// components/LoginForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm";

describe("LoginForm", () => {
  it("renders all form fields", () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows validation error when fields are empty", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByRole("alert")).toHaveTextContent("All fields are required");
  });

  it("calls onSubmit with email and password", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(mockSubmit).toHaveBeenCalledWith("test@example.com", "password123");
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    // Never-resolving promise to keep loading state
    const mockSubmit = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByRole("button")).toHaveTextContent("Signing in...");
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("displays server error message", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});`, "components/LoginForm.test.tsx"),
      callout("tip", "Always query elements the way a user would find them — by role, label, placeholder, or text. Avoid using test IDs unless there is no better option."),

      h2("Mocking API Calls"),
      p("Use Mock Service Worker (MSW) to intercept network requests at the service worker level. This is more realistic than mocking fetch directly."),
      code("typescript", `// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/posts", () => {
    return HttpResponse.json([
      { id: "1", title: "First Post", author: "Alice" },
      { id: "2", title: "Second Post", author: "Bob" },
    ]);
  }),

  http.post("/api/posts", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: "3", ...body },
      { status: 201 }
    );
  }),

  http.delete("/api/posts/:id", ({ params }) => {
    return new HttpResponse(null, { status: 204 });
  }),
];`, "tests/mocks/handlers.ts"),

      h2("End-to-End Testing with Playwright"),
      p("E2E tests verify complete user workflows through the actual application. Use them for critical paths like authentication, checkout, and data-critical flows."),
      code("typescript", `// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("user can sign up and access dashboard", async ({ page }) => {
    await page.goto("/auth/signup");

    await page.getByLabel("Email").fill("newuser@example.com");
    await page.getByLabel("Password").fill("SecurePass123!");
    await page.getByRole("button", { name: "Create Account" }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Welcome")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("alert")).toContainText("Invalid");
  });

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\\/auth\\/login/);
  });
});`, "e2e/auth.spec.ts"),

      h2("Testing Strategy Summary"),
      ...bullet([
        "Static Analysis: TypeScript strict mode + ESLint — runs on every save",
        "Unit Tests: Pure functions and utilities — fast, isolated, no DOM",
        "Integration Tests: Components with user interactions — the bulk of your tests",
        "E2E Tests: Critical user flows only — slow but highest confidence",
      ]),
      p("A good ratio for a React application is roughly 20% unit tests, 60% integration tests, and 20% E2E tests. Focus your effort where bugs are most likely to occur: in the interaction between components."),

      h2("Key Takeaways"),
      ...bullet([
        "Test behavior, not implementation — your tests should not break when you refactor",
        "Use Testing Library to query elements like a user would (by role, label, text)",
        "Vitest is the fastest test runner for modern React applications",
        "Mock Service Worker provides realistic API mocking at the network level",
        "Playwright offers the best developer experience for E2E tests",
        "Write the tests that give you the most confidence, not the most coverage",
      ]),
      callout("tip", "If your test is hard to write, your component might be too complex. Good tests often reveal design issues. If you cannot test a component without mocking ten things, consider simplifying the component."),
    ],
  },
];

// --- Main seeding function ---
async function main() {
  console.log("🌱 Seeding 10 new blog posts (batch 2)...\n");

  // Find or create author
  const existingAuthor = await client.fetch(
    `*[_type == "author" && name == "CodeFromScratch"][0]{ _id }`
  );
  let authorId;
  if (existingAuthor) {
    authorId = existingAuthor._id;
    console.log("✅ Found existing author:", authorId);
  } else {
    const author = await client.create({
      _type: "author",
      name: "CodeFromScratch",
      slug: { _type: "slug", current: "codefromscratch" },
      bio: "Helping developers build real projects from scratch.",
    });
    authorId = author._id;
    console.log("✅ Created author:", authorId);
  }

  for (const post of posts) {
    const slug = slugify(post.title);
    const existing = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]{ _id }`,
      { slug }
    );
    if (existing) {
      console.log(`⏭️  Skipping "${post.title}" (already exists)`);
      continue;
    }

    // Upload featured image
    console.log(`📸 Uploading image for "${post.title}"...`);
    let imageAssetId;
    try {
      imageAssetId = await uploadImage(post.imageUrl, `${slug}.jpg`);
    } catch (err) {
      console.warn(`⚠️  Image upload failed, using placeholder. Error: ${err.message}`);
      imageAssetId = null;
    }

    // Resolve category
    const category = await client.fetch(
      `*[_type == "category" && title == $name][0]{ _id }`,
      { name: post.categoryName }
    );

    // Resolve tags
    const tags = [];
    for (const tagName of post.tagNames) {
      const tag = await client.fetch(
        `*[_type == "tag" && title == $name][0]{ _id }`,
        { name: tagName }
      );
      if (tag) tags.push({ _type: "reference", _ref: tag._id, _key: k() });
    }

    // Stagger publish dates over the past 60 days
    const daysAgo = posts.indexOf(post) * 5 + 2;
    const publishedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

    const doc = {
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: slug },
      author: { _type: "reference", _ref: authorId },
      excerpt: post.excerpt,
      content: post.content,
      categories: category
        ? [{ _type: "reference", _ref: category._id, _key: k() }]
        : [],
      tags,
      status: "published",
      isPremium: post.isPremium,
      seoTitle: post.title,
      seoDescription: post.excerpt,
      publishedAt,
      readingTime: post.readingTime,
    };

    if (imageAssetId) {
      doc.featuredImage = {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
        alt: post.imageAlt,
      };
    }

    await client.create(doc);
    console.log(`✅ Created: "${post.title}"`);
  }

  console.log("\n🎉 Batch 2 seeding complete!");
}

main().catch(console.error);

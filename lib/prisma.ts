import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Fail fast when Postgres is paused or unreachable (free-tier Supabase
  // auto-pauses): without these bounds a render that opportunistically reads
  // stats would hang on the OS TCP timeout instead of hitting its catch
  // block within a few seconds.
  //
  // The database allows 15 connections in total through its pooler, and a
  // frozen serverless instance keeps its connections open for many minutes.
  // pg's default of 10 per instance let one admin page use most of them and
  // would then fail reader sign-ups, so each instance stays small.
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 3_000,
    connectionTimeoutMillis: 3_000,
    query_timeout: 5_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

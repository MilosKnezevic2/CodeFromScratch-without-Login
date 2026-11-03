import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentReader } from "@/lib/comments-store";
import { MAX_FOLDERS, parseFolderName } from "@/lib/reader/rules";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Creates a folder for saved articles. Names are unique per reader. */
export async function POST(request: Request) {
  const reader = await currentReader();
  if (!reader) return json({ error: "Sign in first." }, 401);
  const parsed = parseFolderName(((await request.json().catch(() => null)) as { name?: unknown } | null)?.name);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const count = await prisma.collection.count({ where: { userId: reader.id } });
  if (count >= MAX_FOLDERS) return json({ error: `You can have up to ${MAX_FOLDERS} folders.` }, 409);
  const existing = await prisma.collection.findFirst({ where: { userId: reader.id, name: parsed.name }, select: { id: true, name: true } });
  if (existing) return json(existing);
  const folder = await prisma.collection.create({ data: { userId: reader.id, name: parsed.name }, select: { id: true, name: true } });
  return json(folder, 201);
}

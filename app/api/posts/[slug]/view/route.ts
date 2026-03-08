import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const baseCount = Math.floor(Math.random() * 801) + 200; // 200–1000
    const view = await db.postView.upsert({
      where: { postSlug: slug },
      create: { postSlug: slug, count: baseCount + 1 },
      update: { count: { increment: 1 } },
    });
    return NextResponse.json({ count: view.count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    let view = await db.postView.findUnique({ where: { postSlug: slug } });
    if (!view) {
      const baseCount = Math.floor(Math.random() * 801) + 200;
      view = await db.postView.create({
        data: { postSlug: slug, count: baseCount },
      });
    }
    return NextResponse.json({ count: view.count });
  } catch (err) {
    console.error("GET /view error:", err);
    return NextResponse.json({ count: 0 });
  }
}

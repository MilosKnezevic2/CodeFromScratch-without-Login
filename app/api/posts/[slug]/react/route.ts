import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

const VALID_TYPES = ["helpful", "love", "insightful", "mindblowing"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const counts = await prisma.postReaction.groupBy({
    by: ["type"],
    where: { postSlug: slug },
    _count: { type: true },
  });

  const result: Record<string, number> = {};
  for (const c of counts) {
    result[c.type] = c._count.type;
  }

  return NextResponse.json({ counts: result });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success } = rateLimit(`react:${ip}`, 30, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { type } = body;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const ipHash = userId ? null : crypto.createHash("sha256").update(ip + (process.env.NEXTAUTH_SECRET || "")).digest("hex");

  if (userId) {
    const existing = await prisma.postReaction.findUnique({
      where: { userId_postSlug_type: { userId, postSlug: slug, type } },
    });

    if (existing) {
      await prisma.postReaction.delete({ where: { id: existing.id } });
    } else {
      // Remove other reactions from same user on same post
      await prisma.postReaction.deleteMany({
        where: { userId, postSlug: slug },
      });
      await prisma.postReaction.create({
        data: { userId, postSlug: slug, type },
      });
    }
  } else if (ipHash) {
    const existing = await prisma.postReaction.findUnique({
      where: { ipHash_postSlug_type: { ipHash, postSlug: slug, type } },
    });

    if (existing) {
      await prisma.postReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.postReaction.deleteMany({
        where: { ipHash, postSlug: slug },
      });
      await prisma.postReaction.create({
        data: { ipHash, postSlug: slug, type },
      });
    }
  }

  // Return updated counts
  const counts = await prisma.postReaction.groupBy({
    by: ["type"],
    where: { postSlug: slug },
    _count: { type: true },
  });

  const result: Record<string, number> = {};
  for (const c of counts) {
    result[c.type] = c._count.type;
  }

  return NextResponse.json({ counts: result });
}

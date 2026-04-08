import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { postSlug, scrollPercent } = await request.json();

  if (!postSlug || typeof scrollPercent !== "number") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const clamped = Math.min(100, Math.max(0, Math.round(scrollPercent)));

  await prisma.readingHistory.upsert({
    where: {
      userId_postSlug: { userId: session.user.id, postSlug },
    },
    update: {
      readAt: new Date(),
      scrollPercent: clamped,
      ...(clamped >= 90 ? { completedAt: new Date() } : {}),
    },
    create: {
      userId: session.user.id,
      postSlug,
      scrollPercent: clamped,
      ...(clamped >= 90 ? { completedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ history: [] });
  }

  const history = await prisma.readingHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { readAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ history });
}

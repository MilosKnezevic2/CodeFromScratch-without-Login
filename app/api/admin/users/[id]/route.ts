import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const userInclude = {
  subscription: true,
  readingHistory: { orderBy: { readAt: "desc" as const }, take: 20 },
  savedPosts: { orderBy: { createdAt: "desc" as const }, take: 20 },
  ebookPurchases: {
    orderBy: { createdAt: "desc" as const },
    include: { ebook: { select: { title: true, price: true } } },
  },
  _count: {
    select: { readingHistory: true, savedPosts: true, reactions: true, ebookPurchases: true },
  },
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.role !== undefined) updates.role = body.role;
  if (body.banned !== undefined) updates.banned = body.banned;

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { id }, data: updates });
  }

  if (body.plan !== undefined) {
    const plan = body.plan as "FREE" | "PRO" | "PRO_PLUS";
    await prisma.subscription.upsert({
      where: { userId: id },
      update: { plan, status: "ACTIVE" },
      create: { userId: id, plan, status: "ACTIVE" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });

  return NextResponse.json(user);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

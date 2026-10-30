import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

const ROLES = ["USER", "ADMIN"] as const;
const PLANS = ["FREE", "PRO", "PRO_PLUS"] as const;

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

/** Credentials never leave the server, not even to the administrator's browser. */
const userOmit = { passwordHash: true, mfaSecret: true, mfaBackupCodes: true };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) return forbidden();

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
    omit: userOmit,
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) return forbidden();

  const { id } = await params;
  const body = await request.json();
  const updates: { role?: (typeof ROLES)[number]; banned?: boolean } = {};

  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    updates.role = body.role;
  }
  if (body.banned !== undefined) {
    if (typeof body.banned !== "boolean") return NextResponse.json({ error: "Invalid banned value" }, { status: 400 });
    updates.banned = body.banned;
  }
  if (body.plan !== undefined && !PLANS.includes(body.plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { id }, data: updates });
  }

  if (body.plan !== undefined) {
    const plan = body.plan as (typeof PLANS)[number];
    await prisma.subscription.upsert({
      where: { userId: id },
      update: { plan, status: "ACTIVE" },
      create: { userId: id, plan, status: "ACTIVE" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
    omit: userOmit,
  });

  return NextResponse.json(user);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) return forbidden();

  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const posts = await prisma.savedPostCollection.findMany({
    where: { collectionId: id },
    include: { savedPost: true },
    orderBy: { savedPost: { createdAt: "desc" } },
  });

  return NextResponse.json(posts);
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { savedPostId } = await request.json();

  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const link = await prisma.savedPostCollection.create({
    data: { savedPostId, collectionId: id },
  });

  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { savedPostId } = await request.json();

  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.savedPostCollection.deleteMany({
    where: { savedPostId, collectionId: id },
  });

  return NextResponse.json({ message: "Removed from collection" });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const savedPosts = await prisma.savedPost.findMany({
    where: { userId: session.user.id },
    include: {
      collections: { select: { collectionId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(savedPosts);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postSlug } = await request.json();

  if (!postSlug) {
    return NextResponse.json({ error: "Post slug required" }, { status: 400 });
  }

  const savedPost = await prisma.savedPost.upsert({
    where: {
      userId_postSlug: { userId: session.user.id, postSlug },
    },
    update: {},
    create: { userId: session.user.id, postSlug },
  });

  return NextResponse.json(savedPost, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postSlug } = await request.json();

  await prisma.savedPost.deleteMany({
    where: { userId: session.user.id, postSlug },
  });

  return NextResponse.json({ message: "Removed" });
}

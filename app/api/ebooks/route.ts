import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ebooks = await prisma.ebook.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImageUrl: true,
      price: true,
      freeWithPro: true,
    },
  });

  return NextResponse.json(ebooks);
}

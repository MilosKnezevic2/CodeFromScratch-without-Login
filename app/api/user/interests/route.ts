import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ interests: [] });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { interests: true },
  });

  return NextResponse.json({ interests: user?.interests ?? [] });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { interests } = await request.json();

  if (!Array.isArray(interests) || interests.length === 0) {
    return NextResponse.json({ error: "Select at least one topic" }, { status: 400 });
  }

  // Sanitize — only allow strings, max 20 items
  const clean = interests
    .filter((i: unknown) => typeof i === "string" && i.length > 0)
    .slice(0, 20);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { interests: clean },
  });

  return NextResponse.json({ interests: clean });
}

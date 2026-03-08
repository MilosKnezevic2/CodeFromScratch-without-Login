import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasEbookAccess } from "@/lib/stripe-helpers";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const ebook = await prisma.ebook.findUnique({ where: { slug } });

  if (!ebook) {
    return NextResponse.json({ error: "Ebook not found" }, { status: 404 });
  }

  const access = await hasEbookAccess(session.user.id, ebook.id);
  if (!access) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.redirect(ebook.pdfUrl);
}

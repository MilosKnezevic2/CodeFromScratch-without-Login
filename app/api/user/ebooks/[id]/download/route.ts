import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasEbookAccess } from "@/lib/stripe-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const hasAccess = await hasEbookAccess(session.user.id, id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // In production, generate a signed URL for the PDF from your storage.
  // For now, redirect to the stored PDF URL.
  const { prisma } = await import("@/lib/prisma");
  const ebook = await prisma.ebook.findUnique({ where: { id } });

  if (!ebook) {
    return NextResponse.json({ error: "Ebook not found" }, { status: 404 });
  }

  return NextResponse.redirect(ebook.pdfUrl);
}

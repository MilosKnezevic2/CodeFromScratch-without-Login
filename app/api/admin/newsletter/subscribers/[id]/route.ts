import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/** Removing someone deletes the row, the same as when they unsubscribe themselves. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { count } = await prisma.newsletterSubscriber.deleteMany({ where: { id } });
  if (count === 0) {
    return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
  }

  console.info(`Newsletter: admin removed subscriber ${id}`);
  return new NextResponse(null, { status: 204 });
}

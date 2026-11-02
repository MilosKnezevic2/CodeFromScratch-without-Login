import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { csvCell } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, confirmed: true, createdAt: true, confirmedAt: true },
  });

  const rows = subscribers.map((s) =>
    [
      s.email,
      s.confirmed ? "confirmed" : "pending",
      s.createdAt.toISOString(),
      s.confirmedAt?.toISOString() ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [`"email","status","signed_up","confirmed_at"`, ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
